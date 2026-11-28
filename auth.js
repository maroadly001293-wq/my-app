const SUPABASE_URL = "https://tgsurjfvbfkbvlmsmrag.supabase.co";
const SUPABASE_KEY = "sb_publishable_WJfB15JuE0HWIsoclR3KVQ_TtcuHsOp";

const Auth = (function () {
  const client = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;
  const unavailable = { ok: false, error: "تعذّر تحميل خدمة الحساب. تحقق من الإنترنت." };

  function friendly(error) {
    const m = ((error && error.message) || "").toLowerCase() + " " +
              ((error && error.code) || "").toLowerCase();
    if (m.includes("invalid login")) return "البريد أو كلمة المرور غير صحيحة.";
    if (m.includes("not confirmed")) return "لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد.";
    if (m.includes("already registered")) return "هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.";
    if (m.includes("at least") || m.includes("weak")) return "كلمة المرور ضعيفة. استخدم 8 أحرف أو أكثر.";
    if (m.includes("rate limit") || m.includes("rate_limit") || m.includes("too many")) return "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.";
    if (m.includes("invalid email") || m.includes("email_address_invalid")) return "صيغة البريد غير صحيحة.";
    if (m.includes("failed to fetch") || m.includes("network")) return "تعذّر الاتصال. تحقق من الإنترنت.";
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  async function signUp(email, password) {
    if (!client) return unavailable;
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { emailRedirectTo: new URL("index.html", location.href).href }
    });
    if (error) return { ok: false, error: friendly(error) };
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { ok: false, error: "هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول." };
    }
    return { ok: true, needsConfirm: !data.session };
  }

  async function signIn(email, password) {
    if (!client) return unavailable;
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: friendly(error) };
    return { ok: true };
  }

  async function signOut() {
    if (!client) return unavailable;
    const { error } = await client.auth.signOut();
    if (error) return { ok: false, error: friendly(error) };
    return { ok: true };
  }

  async function getUser() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session ? data.session.user : null;
  }

  async function getToken() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session ? data.session.access_token : null;
  }

  return { signUp, signIn, signOut, getUser, getToken };
})();
