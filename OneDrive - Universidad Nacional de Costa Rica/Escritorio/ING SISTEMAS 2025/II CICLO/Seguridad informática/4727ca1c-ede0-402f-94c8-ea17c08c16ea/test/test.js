// test/unalib.test.js
const assert = require('assert');
const val = require('../libs/unalib');

describe('unalib', function () {

  describe('is_valid_phone', function () {
    it('true para 8297-8547', function () {
      assert.strictEqual(val.is_valid_phone('8297-8547'), true);
    });
    it('false para 8297p-8547', function () {
      assert.strictEqual(val.is_valid_phone('8297p-8547'), false);
    });
  });

  describe('is_valid_url_image', function () {
    it('true para http://image.com/image.jpg', function () {
      assert.strictEqual(val.is_valid_url_image('http://image.com/image.jpg'), true);
    });
    it('true para https://a.b/c.png?x=1#y', function () {
      assert.strictEqual(val.is_valid_url_image('https://a.b/c.png?x=1#y'), true);
    });
    it('false para data:image/png;base64,...', function () {
      assert.strictEqual(val.is_valid_url_image('data:image/png;base64,AAAA'), false);
    });
    it('false para javascript:alert(1)', function () {
      assert.strictEqual(val.is_valid_url_image('javascript:alert(1)'), false);
    });
  });

  describe('is_valid_yt_video', function () {
    it('true para watch?v=', function () {
      assert.strictEqual(
        val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'),
        true
      );
    });
    it('true para youtu.be/', function () {
      assert.strictEqual(
        val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'),
        true
      );
    });
    it('false para ID inválido', function () {
      assert.strictEqual(
        val.is_valid_yt_video('https://www.youtube.com/watch?v=short'),
        false
      );
    });
  });

  describe('validateMessage (XSS y URLs)', function () {
    it('escapa <script> (previene XSS)', function () {
      const raw = JSON.stringify({ nombre: 'A', mensaje: "<script>alert('x')</script>", color: '#000' });
      const out = JSON.parse(val.validateMessage(raw));
      // Debe aparecer escapado
      assert.ok(out.mensaje.includes('&lt;script&gt;alert'));
      assert.ok(!out.mensaje.includes('<script>'));
    });

    it('convierte URL de imagen en <img>', function () {
      const raw = JSON.stringify({ nombre: 'A', mensaje: 'https://site.com/pic.jpg', color: '#000' });
      const out = JSON.parse(val.validateMessage(raw));
      assert.ok(/<img\s+src="https:\/\/site\.com\/pic\.jpg"/.test(out.mensaje));
    });

    it('convierte URL de YouTube en <iframe>', function () {
      const raw = JSON.stringify({ nombre: 'A', mensaje: 'https://youtu.be/qYwlqx-JLok', color: '#000' });
      const out = JSON.parse(val.validateMessage(raw));
      assert.ok(/<iframe[^>]+src="https:\/\/www\.youtube\.com\/embed\/qYwlqx-JLok"/.test(out.mensaje));
    });

    it('rechaza javascript: URL y la muestra escapada', function () {
      const raw = JSON.stringify({ nombre: 'A', mensaje: 'javascript:alert(1)', color: '#000' });
      const out = JSON.parse(val.validateMessage(raw));
      assert.ok(out.mensaje.includes('javascript:alert(1)')); // pero escapado (sin < >)
      assert.ok(!out.mensaje.includes('<a '));
    });
  });

});