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
        reject(new Error("turnstile_timeout"));
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
        reject(new Error("turnstile_load_failed"));
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
      this.turnstileHost = root.querySelector("[data-hkw-turnstile]");
      this.widgetId = null;
    }

    async init() {
      if (!this.endpoint || !this.sitekey || this.endpoint.includes("__") || this.sitekey.includes("__")) {
        this.setStatus("Impressum ist noch nicht vollständig konfiguriert.", true);
        return;
      }

      try {
        await loadTurnstile();
        await this.requestImage();
      } catch (error) {
        this.showError(error);
      }
    }

    async requestImage() {
      this.setStatus("Anbieterangaben werden geladen …");
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

      if (!response.ok) {
        const error = new Error(`render_${response.status}`);
        error.status = response.status;
        throw error;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/png")) {
        throw new Error("render_invalid_content_type");
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("render_empty_image");

      await this.drawBlobToCanvas(blob);
      if (this.status) this.status.hidden = true;
    }

    async getTurnstileToken(action) {
      const turnstile = await loadTurnstile();
      if (!this.turnstileHost) throw new Error("turnstile_container_missing");

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
          "error-callback": () => reject(new Error("turnstile_verification_failed")),
          "expired-callback": () => reject(new Error("turnstile_token_expired")),
          "timeout-callback": () => reject(new Error("turnstile_challenge_timeout"))
        });
      });
    }

    async drawBlobToCanvas(blob) {
      if (!this.canvas) throw new Error("canvas_missing");

      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.decoding = "async";

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error("image_decode_failed"));
          image.src = objectUrl;
        });

        if (!image.naturalWidth || !image.naturalHeight) {
          throw new Error("image_dimensions_invalid");
        }

        this.canvas.width = image.naturalWidth;
        this.canvas.height = image.naturalHeight;

        const ctx = this.canvas.getContext("2d", { alpha: true });
        if (!ctx) throw new Error("canvas_context_missing");

        ctx.clearRect(0, 0, image.naturalWidth, image.naturalHeight);
        ctx.drawImage(image, 0, 0);
        this.canvas.hidden = false;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    showError(error) {
      if (error?.status === 429 || error?.message === "render_429") {
        this.setStatus("Zu viele Abrufe in kurzer Zeit. Bitte die Seite gleich noch einmal laden.", true);
        return;
      }

      if (error?.status === 403 || error?.message === "render_403") {
        this.setStatus("Die Sicherheitsprüfung konnte nicht bestätigt werden. Bitte die Seite neu laden.", true);
        return;
      }

      if (String(error?.message || "").startsWith("turnstile_")) {
        this.setStatus("Die Sicherheitsprüfung konnte nicht geladen werden. Bitte die Seite neu laden.", true);
        return;
      }

      if (error?.status === 503 || error?.message === "render_503") {
        this.setStatus("Die Anbieterangaben konnten serverseitig nicht erzeugt werden.", true);
        return;
      }

      if (["render_invalid_content_type", "render_empty_image"].includes(error?.message)) {
        this.setStatus("Der Server hat keine gültige Bilddarstellung geliefert. Bitte die Seite neu laden.", true);
        return;
      }

      if (["image_decode_failed", "image_dimensions_invalid", "canvas_missing", "canvas_context_missing"].includes(error?.message)) {
        this.setStatus("Die Anbieterangaben konnten im Browser nicht dargestellt werden. Bitte die Seite neu laden.", true);
        return;
      }

      if (error instanceof TypeError || /failed to fetch/i.test(String(error?.message || ""))) {
        this.setStatus("Die Verbindung zum Anbieterangaben-Dienst konnte nicht hergestellt werden. Bitte die Seite neu laden.", true);
        return;
      }

      this.setStatus("Die Anbieterangaben konnten gerade nicht geladen werden. Bitte die Seite neu laden.", true);
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
