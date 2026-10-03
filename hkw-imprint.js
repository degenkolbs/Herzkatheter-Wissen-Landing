(() => {
  "use strict";

  const selector = "[data-hkw-imprint]";
  let turnstilePromise;

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;

    turnstilePromise = new Promise((resolve, reject) => {
      const callbackName = `__hkwTurnstileReady_${crypto.randomUUID().replaceAll("-", "")}`;
      const timeout = window.setTimeout(() => {
        delete window[callbackName];
        reject(new Error("Turnstile timeout"));
      }, 15000);

      window[callbackName] = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        resolve(window.turnstile);
      };

      const script = document.createElement("script");
      script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${encodeURIComponent(callbackName)}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        reject(new Error("Turnstile load failed"));
      };
      document.head.appendChild(script);
    });

    return turnstilePromise;
  }

  class HkwImprint {
    constructor(root) {
      this.root = root;
      this.endpoint = (root.dataset.endpoint || "").replace(/\/$/, "");
      this.sitekey = root.dataset.sitekey || "";
      this.status = root.querySelector("[data-hkw-status]");
      this.canvas = root.querySelector("[data-hkw-canvas]");
      this.textButton = root.querySelector("[data-hkw-text-button]");
      this.textOutput = root.querySelector("[data-hkw-text]");
      this.turnstileHost = root.querySelector("[data-hkw-turnstile]");
      this.widgetId = null;
    }

    async init() {
      if (!this.endpoint || !this.sitekey || this.endpoint.includes("__") || this.sitekey.includes("__")) {
        this.setStatus("Impressum ist noch nicht vollständig konfiguriert.", true);
        return;
      }

      this.textButton?.addEventListener("click", () => this.requestText());

      try {
        await loadTurnstile();
        await this.requestImage();
      } catch {
        this.setStatus("Die Anbieterangaben konnten gerade nicht geladen werden. Bitte später erneut versuchen.", true);
      }
    }

    async requestImage() {
      this.setStatus("Anbieterangaben werden sicher geladen …");
      const token = await this.getTurnstileToken("imprint_render");

      const response = await fetch(`${this.endpoint}/v1/render`, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turnstileToken: token })
      });

      if (!response.ok) throw new Error(`Render failed: ${response.status}`);
      const blob = await response.blob();
      await this.drawBlobToCanvas(blob);

      this.status.hidden = true;
      if (this.textButton) this.textButton.hidden = false;
    }

    async requestText() {
      if (!this.textButton || !this.textOutput) return;

      this.textButton.disabled = true;
      this.setStatus("Barrierefreie Textansicht wird sicher geladen …");

      try {
        const token = await this.getTurnstileToken("imprint_text");
        const response = await fetch(`${this.endpoint}/v1/text`, {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ turnstileToken: token })
        });

        if (!response.ok) throw new Error(`Text failed: ${response.status}`);
        this.textOutput.textContent = await response.text();
        this.textOutput.hidden = false;
        this.status.hidden = true;
        this.textButton.hidden = true;
        this.textOutput.focus({ preventScroll: false });
      } catch {
        this.setStatus("Die Textansicht konnte gerade nicht geladen werden.", true);
        this.textButton.disabled = false;
      }
    }

    async getTurnstileToken(action) {
      const turnstile = await loadTurnstile();
      if (!this.turnstileHost) throw new Error("Turnstile container missing");

      if (this.widgetId !== null) {
        try { turnstile.remove(this.widgetId); } catch {}
        this.widgetId = null;
      }

      this.turnstileHost.replaceChildren();

      return new Promise((resolve, reject) => {
        this.widgetId = turnstile.render(this.turnstileHost, {
          sitekey: this.sitekey,
          action,
          appearance: "interaction-only",
          execution: "render",
          theme: "auto",
          callback: token => resolve(token),
          "error-callback": () => reject(new Error("Turnstile verification failed")),
          "expired-callback": () => reject(new Error("Turnstile token expired")),
          "timeout-callback": () => reject(new Error("Turnstile challenge timed out"))
        });
      });
    }

    async drawBlobToCanvas(blob) {
      if (!this.canvas) throw new Error("Canvas missing");

      if ("createImageBitmap" in window) {
        const bitmap = await createImageBitmap(blob);
        try {
          this.canvas.width = bitmap.width;
          this.canvas.height = bitmap.height;
          const ctx = this.canvas.getContext("2d", { alpha: true });
          ctx.clearRect(0, 0, bitmap.width, bitmap.height);
          ctx.drawImage(bitmap, 0, 0);
          this.canvas.hidden = false;
        } finally {
          bitmap.close();
        }
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.decoding = "async";
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = objectUrl;
        });
        this.canvas.width = image.naturalWidth;
        this.canvas.height = image.naturalHeight;
        const ctx = this.canvas.getContext("2d", { alpha: true });
        ctx.clearRect(0, 0, image.naturalWidth, image.naturalHeight);
        ctx.drawImage(image, 0, 0);
        this.canvas.hidden = false;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    setStatus(message, isError = false) {
      if (!this.status) return;
      this.status.hidden = false;
      this.status.textContent = message;
      this.status.dataset.state = isError ? "error" : "loading";
    }
  }

  function boot() {
    document.querySelectorAll(selector).forEach(root => {
      if (root.dataset.hkwReady === "1") return;
      root.dataset.hkwReady = "1";
      new HkwImprint(root).init();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
