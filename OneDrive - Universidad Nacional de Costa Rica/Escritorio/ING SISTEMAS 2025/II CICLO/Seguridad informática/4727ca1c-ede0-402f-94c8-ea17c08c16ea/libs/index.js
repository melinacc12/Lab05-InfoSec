// una-lib/index.js

// Escapa HTML para neutralizar XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Comprueba que la URL tenga protocolo http(s)
function isSafeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const protocol = u.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") return false;
    return true;
  } catch (e) {
    return false;
  }
}

const imageExt = /\.(png|jpe?g|gif|bmp|webp|svg)(\?.*)?$/i;
const videoExt = /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i;
const urlRegex = /https?:\/\/[^\s<>"']+/g;

function validarMensaje(input) {
  if (typeof input !== "string") return "";

  // Escape inicial
  let escaped = escapeHtml(input);

  // Buscamos URLs en el texto original
  const matches = input.match(urlRegex);
  if (!matches) return escaped;

  matches.forEach((rawUrl) => {
    const trimmed = rawUrl.trim();
    if (!isSafeUrl(trimmed)) return; // ignora URL insegura

    const safeUrl = escapeHtml(trimmed);

    if (imageExt.test(trimmed)) {
      const imgTag = `<img src="${safeUrl}" alt="imagen" style="max-width:320px;max-height:240px;border-radius:6px;" loading="lazy">`;
      escaped = escaped.replace(escapeHtml(trimmed), imgTag);
    } else if (videoExt.test(trimmed)) {
      const videoTag = `<video controls style="max-width:420px;max-height:320px;border-radius:6px;"><source src="${safeUrl}"></video>`;
      escaped = escaped.replace(escapeHtml(trimmed), videoTag);
    } else {
      const anchor = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
      escaped = escaped.replace(escapeHtml(trimmed), anchor);
    }
  });

  return escaped;
}

module.exports = { validarMensaje, escapeHtml, isSafeUrl };
