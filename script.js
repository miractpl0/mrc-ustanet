/* ============================================================
   MRC UstaNet — script.js
   - Sayfa geçişi (basit router)
   - Mobil menü
   - Form doğrulama + WhatsApp'a gönderim
============================================================ */

// WhatsApp numarası (ülke kodu ile, + ve boşluk olmadan). DEĞİŞTİRİN.
const WA_NUMBER = "905555555555";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("yil").textContent = new Date().getFullYear();
  initRouter();
  initMenu();
  initForm("musteriForm", buildMusteriMessage, "Talebiniz hazır");
  initForm("ustaForm", buildUstaMessage, "Başvurunuz hazır");
});

/* ---------------- ROUTER ---------------- */
function initRouter(){
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if(!link) return;
    e.preventDefault();
    goToPage(link.getAttribute("data-link"));
    closeMenu();
  });
}

function goToPage(name){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("is-active"));
  const target = document.getElementById("page-" + name);
  if(target) target.classList.add("is-active");

  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("is-active", l.getAttribute("data-link") === name);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- MOBİL MENÜ ---------------- */
function initMenu(){
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}
function closeMenu(){
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}

/* ---------------- FORM DOĞRULAMA ---------------- */
function initForm(formId, messageBuilder, successTitle){
  const form = document.getElementById(formId);
  if(!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;

    // zorunlu input / select / textarea
    form.querySelectorAll("[required]").forEach(el => {
      if(el.type === "checkbox") return; // kvkk ayrı
      const field = el.closest(".field");
      const valid = el.value.trim() !== "";
      if(field){
        field.classList.toggle("invalid", !valid);
        const err = field.querySelector(".err");
        if(err && !valid) err.textContent = "Bu alan zorunludur.";
      }
      // telefon basit kontrol
      if(valid && el.name === "telefon"){
        const digits = el.value.replace(/\D/g,"");
        if(digits.length < 10){
          ok = false;
          if(field){ field.classList.add("invalid"); field.querySelector(".err").textContent = "Geçerli bir telefon numarası girin."; }
        }
      }
      if(!valid) ok = false;
    });

    // KVKK onayı
    const kvkk = form.querySelector('input[name="kvkk"]');
    const kvkkErr = form.querySelector(".err-kvkk");
    if(kvkk && !kvkk.checked){
      ok = false;
      if(kvkkErr){ kvkkErr.textContent = "Devam etmek için KVKK onayı gereklidir."; kvkkErr.classList.add("show"); }
    } else if(kvkkErr){ kvkkErr.classList.remove("show"); }

    // usta formu: en az bir bölge
    if(formId === "ustaForm"){
      const bolgeler = form.querySelectorAll('input[name="bolge"]:checked');
      const bolgeErr = form.querySelector(".err-bolge");
      if(bolgeler.length === 0){
        ok = false;
        if(bolgeErr){ bolgeErr.textContent = "En az bir bölge seçin."; bolgeErr.classList.add("show"); }
      } else if(bolgeErr){ bolgeErr.classList.remove("show"); }
    }

    if(!ok){
      const firstErr = form.querySelector(".invalid, .err-kvkk.show, .err-bolge.show");
      if(firstErr) firstErr.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }

    // Başarılı: WhatsApp mesajı oluştur
    const msg = messageBuilder(form);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    showSuccess(form, successTitle, url);
  });

  // yazdıkça hata temizle
  form.querySelectorAll("input,select,textarea").forEach(el => {
    el.addEventListener("input", () => {
      const field = el.closest(".field");
      if(field) field.classList.remove("invalid");
    });
  });
}

/* ---------------- MESAJ OLUŞTURUCULAR ---------------- */
function val(form, name){
  const el = form.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : "";
}

function buildMusteriMessage(form){
  return [
    "*MRC UstaNet — Müşteri Talebi*",
    "",
    `Ad Soyad: ${val(form,"adSoyad")}`,
    `Telefon: ${val(form,"telefon")}`,
    `İl / İlçe: ${val(form,"il")} / ${val(form,"ilce")}`,
    `Hizmet türü: ${val(form,"hizmetTuru")}`,
    `Aciliyet: ${val(form,"aciliyet")}`,
    "",
    `Açıklama: ${val(form,"aciklama")}`
  ].join("\n");
}

function buildUstaMessage(form){
  const bolgeler = [...form.querySelectorAll('input[name="bolge"]:checked')].map(c => c.value).join(", ");
  return [
    "*MRC UstaNet — Usta Başvurusu*",
    "",
    `Ad Soyad: ${val(form,"adSoyad")}`,
    `Telefon: ${val(form,"telefon")}`,
    `İl / İlçe: ${val(form,"il")} / ${val(form,"ilce")}`,
    `Uzmanlık: ${val(form,"uzmanlik")}`,
    `Tecrübe: ${val(form,"tecrube")}`,
    `Araç: ${val(form,"aracDurumu")}`,
    `Belge/Sertifika: ${val(form,"belge") || "-"}`,
    `Çalışılabilir bölgeler: ${bolgeler}`,
    `Referans: ${val(form,"referans") || "-"}`
  ].join("\n");
}

/* ---------------- BAŞARI EKRANI ---------------- */
function showSuccess(form, title, waUrl){
  const box = document.createElement("div");
  box.className = "form-success";
  box.innerHTML = `
    <h3>${title}</h3>
    <p>Bilgileri WhatsApp üzerinden bize iletmek için aşağıdaki butona dokunun. Mesaj otomatik hazırlanır.</p>
    <a class="btn btn-wa btn-lg" href="${waUrl}" target="_blank" rel="noopener">WhatsApp'tan Gönder</a>
  `;
  form.replaceWith(box);
  box.scrollIntoView({ behavior:"smooth", block:"center" });

  // Aynı anda WhatsApp'ı açmayı dene (kullanıcı etkileşimi içinde olduğundan genelde çalışır)
  window.open(waUrl, "_blank");
}
