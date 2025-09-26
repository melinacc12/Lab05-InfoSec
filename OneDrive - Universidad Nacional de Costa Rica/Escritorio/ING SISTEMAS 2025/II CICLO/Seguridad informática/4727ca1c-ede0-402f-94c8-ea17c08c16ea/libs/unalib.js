// libs/unalib.js

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {

  is_valid_phone: function (phone) {
    let isValid = false;
    const re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/i;
    try {
      isValid = re.test(phone);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  // ✅ AHORA acepta:
  //   - URLs http/https que TERMINAN en .jpg/.jpeg/.png/.gif/.bmp/.webp
  //   - URLs de Unsplash SIN extensión: https://images.unsplash.com/photo-...
  is_valid_url_image: function (url) {
    let isValid = false;

    // Extensiones comunes; permite querystring/fragment
    const extRe = /^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|bmp|webp)(?:[?#][^\s]*)?$/i;

    try {
      if (typeof url !== 'string' || !isSafeHttpUrl(url)) return false;

      if (extRe.test(url)) {
        isValid = true;
      } else {
        // Whitelist de hosts que sirven imagen sin extensión (ej. Unsplash)
        // Unsplash: https://images.unsplash.com/photo-XXXXXXXXXXXX
        const u = new URL(url);
        const host = u.hostname.toLowerCase();

        if (host === 'images.unsplash.com') {
          // Path típico: /photo-<id>
          isValid = /^\/photo-[A-Za-z0-9_-]+/.test(u.pathname);
        }

        // (Opcional) agrega otros hosts que sirven imagen sin extensión:
        // if (host === 'picsum.photos') isValid = true;   // suelen ser imágenes
      }
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  // YouTube: watch?v=, embed/, v/, shorts/, youtu.be/
  is_valid_yt_video: function (url) {
    let isValid = false;
    const re =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[^\s]*)?$/i;
    try {
      isValid = typeof url === 'string' && isSafeHttpUrl(url) && re.test(url);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  getYTVideoId: function (url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        if (u.hostname.includes('youtu.be')) {
          const id = u.pathname.slice(1);
          if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
        }
        const v = u.searchParams.get('v');
        if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

        const mShort = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
        if (mShort) return mShort[1];

        const m = u.pathname.match(/\/(?:embed|v)\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];
      }
    } catch (_) {}

    const m = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (m) return m[1];
    return null;
  },

  getEmbeddedCode: function (url) {
    const id = this.getYTVideoId(url);
    if (!id) return '';
    return (
      '<iframe width="560" height="315" ' +
      'src="https://www.youtube.com/embed/' + id + '" ' +
      'frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ' +
      'referrerpolicy="no-referrer" allowfullscreen></iframe>'
    );
  },

  // ✅ AHORA envuelve la imagen con <a href="URL"> para que sea clickeable
  getImageTag: function (url) {
    const safeUrl = url; // ya pasó validación
    return (
      '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">' +
        '<img src="' + safeUrl + '" alt="image" style="max-height:400px;max-width:400px;" />' +
      '</a>'
    );
  },

  validateMessage: function (msg) {
    if (!msg || typeof msg !== 'string') {
      return JSON.stringify({ mensaje: '' });
    }

    try {
      const obj = JSON.parse(msg);
      if (typeof obj.mensaje !== 'string') obj.mensaje = '';
      if (typeof obj.nombre !== 'string') obj.nombre = 'Anónimo';
      if (typeof obj.color !== 'string') obj.color = '#000000';

      const raw = obj.mensaje.trim();

      // Imagen válida → <a><img/></a>
      if (this.is_valid_url_image(raw)) {
        obj.mensaje = this.getImageTag(raw);
        return JSON.stringify(obj);
      }

      // YouTube válido → <iframe>
      if (this.is_valid_yt_video(raw)) {
        const code = this.getEmbeddedCode(raw);
        if (code) {
          obj.mensaje = code;
          return JSON.stringify(obj);
        }
      }

      // Texto plano (escapado) y bloqueo de vectores típicos
      const suspicious = /<\s*script\b|on\w+\s*=|javascript:|data:text\/html/i.test(raw);
      if (suspicious) {
        obj.mensaje = escapeHtml(raw);
        return JSON.stringify(obj);
      }

      obj.mensaje = escapeHtml(raw);
      return JSON.stringify(obj);
    } catch (e) {
      console.log('Error processing message:', e);
      return JSON.stringify({ mensaje: escapeHtml(msg) });
    }
  }
};