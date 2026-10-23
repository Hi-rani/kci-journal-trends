/**
 * 국내 학술지 동향 분석 - 20페이지 HTML 프레젠테이션 스크립트
 * Powered by Anime.js & High-Resolution Vector Graphics
 * Self-contained, robust, works offline & via file:// protocol
 */

// 단일 진실 소스 (SSOT) 데이터 객체
const KCI_DATA = {
  metadata: {
    title: "국내 학술지 동향 분석",
    subtitle: "KCI 통계 기반 현황 진단과 국내 학계의 발전 방향 제언",
    asOfDate: "2026.10.23",
    sourceUrl: "https://www.kci.go.kr/kciportal/po/statistics/poStatisticsMain.kci",
    totalJournals: 6359,
    indexedJournals: 2932,
    indexedRatio: 46.11,
    totalOrganizations: 11168,
    indexedOrgs: 2729
  },
  publishers: {
    labels: ["학회", "대학부설연구소", "기타(일반)기관"],
    total: [3466, 2664, 229],
    indexed: [2275, 532, 125],
    indexedRatio: [65.64, 19.97, 54.59]
  },
  indexedStatus: {
    labels: ["우수등재", "등재", "등재후보"],
    counts: [67, 2691, 174],
    ratios: [2.29, 91.78, 5.93]
  },
  fields: {
    labels: ["인문사회분야", "과학기술분야"],
    counts: [2077, 855],
    ratios: [70.84, 29.16]
  },
  orgs: {
    labels: ["학회", "대학부설연구소", "일반기관"],
    total: [4437, 6534, 197],
    indexed: [2118, 498, 113]
  }
};

class PresentationController {
  constructor() {
    this.slides = document.querySelectorAll(".slide");
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;
    this.isNotesOpen = false;

    // 모션 감소 선호 여부 확인
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // UI 요소
    this.pageDisplay = document.getElementById("page-number-display");
    this.progressBar = document.getElementById("progress-bar");
    this.prevBtn = document.getElementById("prev-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.notesDrawer = document.getElementById("notes-drawer");
    this.notesContent = document.getElementById("notes-content");
    this.notesToggleBtn = document.getElementById("notes-toggle-btn");
    this.fullscreenBtn = document.getElementById("fullscreen-btn");

    this.init();
  }

  init() {
    this.bindEvents();
    this.goToSlide(0);
    this.renderCharts();
  }

  bindEvents() {
    // 키보드 네비게이션
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          this.nextSlide();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          this.prevSlide();
          break;
        case "Home":
          e.preventDefault();
          this.goToSlide(0);
          break;
        case "End":
          e.preventDefault();
          this.goToSlide(this.totalSlides - 1);
          break;
        case "n":
        case "N":
          this.toggleNotes();
          break;
        case "f":
        case "F":
          this.toggleFullscreen();
          break;
      }
    });

    // 버튼 이벤트
    if (this.prevBtn) this.prevBtn.addEventListener("click", () => this.prevSlide());
    if (this.nextBtn) this.nextBtn.addEventListener("click", () => this.nextSlide());
    if (this.notesToggleBtn) this.notesToggleBtn.addEventListener("click", () => this.toggleNotes());
    if (this.fullscreenBtn) this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());

    // 터치 스와이프
    let touchStartX = 0;
    document.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 50) {
        if (diffX < 0) this.nextSlide();
        else this.prevSlide();
      }
    }, { passive: true });
  }

  goToSlide(index) {
    if (index < 0 || index >= this.totalSlides) return;

    this.slides.forEach((slide, idx) => {
      slide.classList.remove("active", "prev");
      if (idx === index) {
        slide.classList.add("active");
      } else if (idx < index) {
        slide.classList.add("prev");
      }
    });

    this.currentIndex = index;
    this.updateControls();
    this.updateNotes();
    this.animateSlideContent(this.slides[index]);
  }

  nextSlide() {
    if (this.currentIndex < this.totalSlides - 1) {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  updateControls() {
    // 번호 표시 (01 / 20)
    const curStr = String(this.currentIndex + 1).padStart(2, "0");
    const totStr = String(this.totalSlides).padStart(2, "0");
    if (this.pageDisplay) {
      this.pageDisplay.textContent = `${curStr} / ${totStr}`;
    }

    // 프로그레스 바 (Anime.js 활용 부드러운 전환)
    if (this.progressBar) {
      const targetWidth = ((this.currentIndex + 1) / this.totalSlides) * 100;
      if (window.anime && !this.prefersReducedMotion) {
        anime({
          targets: this.progressBar,
          width: `${targetWidth}%`,
          duration: 350,
          easing: "easeOutQuad"
        });
      } else {
        this.progressBar.style.width = `${targetWidth}%`;
      }
    }

    // 버튼 상태
    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === this.totalSlides - 1;
  }

  updateNotes() {
    if (!this.notesContent) return;
    const currentSlide = this.slides[this.currentIndex];
    const notesData = currentSlide.getAttribute("data-notes");
    if (notesData) {
      this.notesContent.innerHTML = notesData;
    } else {
      this.notesContent.innerHTML = "<em>이 슬라이드에는 등록된 발표자 노트가 없습니다.</em>";
    }
  }

  toggleNotes() {
    this.isNotesOpen = !this.isNotesOpen;
    if (this.notesDrawer) {
      this.notesDrawer.classList.toggle("open", this.isNotesOpen);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn("Exit fullscreen error:", err);
      });
    }
  }

  animateSlideContent(slideElement) {
    if (this.prefersReducedMotion) return;

    // Anime.js를 활용한 카드 및 요소 순차 등장 (Stagger)
    if (window.anime) {
      const staggerTargets = slideElement.querySelectorAll(".stat-card, .info-card, .roadmap-step");
      if (staggerTargets.length > 0) {
        anime({
          targets: staggerTargets,
          translateY: [16, 0],
          opacity: [0.3, 1],
          delay: anime.stagger(60),
          duration: 450,
          easing: "easeOutCubic"
        });
      }
    }

    // 숫자 카운트업 애니메이션 (Anime.js 지원)
    const counters = slideElement.querySelectorAll(".count-up");
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute("data-target"));
      const isPercent = counter.getAttribute("data-percent") === "true";

      if (window.anime) {
        const obj = { val: 0 };
        anime({
          targets: obj,
          val: target,
          duration: 800,
          easing: "easeOutExpo",
          update: () => {
            if (isPercent) {
              counter.textContent = obj.val.toFixed(1) + "%";
            } else {
              counter.textContent = Math.round(obj.val).toLocaleString();
            }
          }
        });
      } else {
        counter.textContent = isPercent ? target.toFixed(1) + "%" : Math.round(target).toLocaleString();
      }
    });

    // 바 필 애니메이션
    const bars = slideElement.querySelectorAll(".bar-fill");
    bars.forEach(bar => {
      const targetWidth = bar.getAttribute("data-width");
      bar.style.width = "0%";
      setTimeout(() => {
        bar.style.width = targetWidth;
      }, 50);
    });
  }

  renderCharts() {
    // Canvas 기반 자체 렌더링 (도넛 및 수평 막대)
    this.renderDonutChart("chart-publishers", [
      { label: "학회", value: 3466, color: "#3b82f6" },
      { label: "대학부설연구소", value: 2664, color: "#0ea5e9" },
      { label: "기타(일반)기관", value: 229, color: "#64748b" }
    ]);

    this.renderHorizontalBarChart("chart-org-structure", [
      { label: "학회", value: 2118, total: 4437, color: "#3b82f6" },
      { label: "대학부설연구소", value: 498, total: 6534, color: "#0ea5e9" },
      { label: "일반기관", value: 113, total: 197, color: "#64748b" }
    ]);

    this.renderDonutChart("chart-field-comparison", [
      { label: "인문사회분야 (70.8%)", value: 2077, color: "#3b82f6" },
      { label: "과학기술분야 (29.2%)", value: 855, color: "#10b981" }
    ]);
  }

  renderDonutChart(canvasId, items) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const outerRadius = Math.min(centerX, centerY) * 0.75;
    const innerRadius = outerRadius * 0.52;

    const total = items.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -0.5 * Math.PI;

    items.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px " + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total.toLocaleString()}종`, centerX, centerY - 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText("합계", centerX, centerY + 12);
  }

  renderHorizontalBarChart(canvasId, items) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 70, bottom: 20, left: 110 };
    const chartWidth = rect.width - padding.left - padding.right;
    const rowHeight = (rect.height - padding.top - padding.bottom) / items.length;

    const maxTotal = Math.max(...items.map(i => i.total));

    items.forEach((item, idx) => {
      const y = padding.top + idx * rowHeight + rowHeight * 0.25;
      const barH = rowHeight * 0.45;

      ctx.fillStyle = "#ffffff";
      ctx.font = "13px " + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, padding.left - 15, y + barH / 2);

      const trackW = (item.total / maxTotal) * chartWidth;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(padding.left, y, trackW, barH, 4);
      ctx.fill();

      const fillW = (item.value / maxTotal) * chartWidth;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, fillW, barH, 4);
      ctx.fill();

      const ratio = ((item.value / item.total) * 100).toFixed(1);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${item.value.toLocaleString()}개 (${ratio}%)`, padding.left + fillW + 10, y + barH / 2);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.presentation = new PresentationController();
});
