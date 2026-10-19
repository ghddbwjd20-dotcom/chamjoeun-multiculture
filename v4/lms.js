(function (global) {
  const KEY = "chamjoeun-lms";
  const COURSES = [
    {id:"kiip",cat:"법무부",name:"사회통합프로그램(KIIP)",desc:"공식 과정조회·신청은 사회통합정보망에서 합니다.",img:"media/quick-kiip.jpg",lessons:[],official:"https://www.socinet.go.kr/soci/main/main.jsp?MENU_TYPE=S_TOP_SY",officialLabel:"과정조회"},
    {id:"early",cat:"법무부",name:"조기적응프로그램",desc:"입국 초기 안내는 센터에서 받습니다. 홈페이지에서 바로 신청하지 않습니다.",img:"media/quick-early.jpg",lessons:[],official:"ministry.html#early",officialLabel:"이용 안내"},
    {id:"korean",cat:"교육",name:"한국어 교육",desc:"생활 한국어와 의사소통을 중심으로 배웁니다.",img:"banners/education.jpg",lessons:["발음과 인사","시장·병원 회화","서류 읽기","복습"]},
    {id:"license",cat:"자격",name:"민간자격과정",desc:"병원동행, 기초학력, 방과후 등 현장 직무 과정을 수강합니다.",img:"banners/programs.jpg",lessons:["과정 소개","이론 강의","실습 안내","평가"]},
    {id:"lifelong",cat:"평생",name:"평생교육 · 성인문해",desc:"성인문해와 직업훈련으로 학습을 이어 갑니다.",img:"banners/ministry.jpg",lessons:["학습 안내","기초 문해","생활 활용","마무리"]}
  ];

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const state = () => {
    const s = load();
    if (!s.users) s.users = [];
    if (!s.session) s.session = null;
    if (!s.enrolls) s.enrolls = {};
    if (!s.attend) s.attend = {};
    return s;
  };

  const api = {
    courses: COURSES,
    course(id) { return COURSES.find((c) => c.id === id) || COURSES[0]; },
    user() {
      const s = state();
      return s.users.find((u) => u.email === s.session) || null;
    },
    register(form) {
      const s = state();
      const email = (form.email || "").trim().toLowerCase();
      if (!form.name || !email || !form.password) return "이름, 이메일, 비밀번호를 입력해 주세요.";
      if (s.users.some((u) => u.email === email)) return "이미 가입된 이메일입니다.";
      s.users.push({name: form.name.trim(), email, password: form.password});
      s.session = email;
      if (!s.enrolls[email]) s.enrolls[email] = [];
      save(s);
      return "";
    },
    login(email, password) {
      const s = state();
      const user = s.users.find((u) => u.email === (email || "").trim().toLowerCase() && u.password === password);
      if (!user) return "이메일 또는 비밀번호가 맞지 않습니다.";
      s.session = user.email;
      save(s);
      return "";
    },
    logout() {
      const s = state();
      s.session = null;
      save(s);
    },
    enroll(id) {
      const user = api.user();
      const course = api.course(id);
      if (!user || !course || course.official) return false;
      const s = state();
      const list = s.enrolls[user.email] || [];
      if (!list.includes(id)) list.push(id);
      s.enrolls[user.email] = list;
      save(s);
      return true;
    },
    enrolled() {
      const user = api.user();
      if (!user) return [];
      const ids = state().enrolls[user.email] || [];
      return ids.map((id) => api.course(id)).filter(Boolean);
    },
    isEnrolled(id) {
      return api.enrolled().some((c) => c.id === id);
    },
    markAttend(courseId, lesson) {
      const user = api.user();
      if (!user) return;
      const s = state();
      const key = user.email + ":" + courseId;
      const set = s.attend[key] || [];
      if (!set.includes(lesson)) set.push(lesson);
      s.attend[key] = set;
      save(s);
    },
    attended(courseId) {
      const user = api.user();
      if (!user) return [];
      return state().attend[user.email + ":" + courseId] || [];
    },
    requireAuth(next) {
      if (api.user()) return true;
      location.href = "login.html?next=" + encodeURIComponent(next || "classroom.html");
      return false;
    },
    next() {
      const q = new URLSearchParams(location.search);
      return q.get("next") || "classroom.html";
    },
    paintAccount() {
      const slot = document.querySelector("[data-lms-account]");
      if (!slot) return;
      const user = api.user();
      if (user) {
        slot.innerHTML = '<a href="classroom.html">' + user.name + " 강의실</a> · <button type=\"button\" id=\"lmsOut\">로그아웃</button>";
        const out = document.getElementById("lmsOut");
        if (out) out.onclick = () => { api.logout(); location.href = "education.html"; };
      } else {
        slot.innerHTML = '<a href="login.html">로그인</a> · <a href="register.html">회원가입</a>';
      }
    }
  };

  global.LMS = api;
  document.addEventListener("DOMContentLoaded", () => api.paintAccount());
})(window);
