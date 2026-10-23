/**
 * 국내 학술지 동향 분석 - 20페이지 HTML 프레젠테이션 스크립트
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

// 프레젠테이션 컨트롤러
class PresentationController {
  constructor() {
    this.slides = document.querySelectorAll(".slide");
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;
    this.isNotesOpen = false;

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
    // 번호 표시 (두 자리 패딩: 01 / 20)
    const curStr = String(this.currentIndex + 1).padStart(2, "0");
    const totStr = String(this.totalSlides).padStart(2, "0");
    if (this.pageDisplay) {
      this.pageDisplay.textContent = `${curStr} / ${totStr}`;
    }

    // 프로그레스 바
    if (this.progressBar) {
      const progress = ((this.currentIndex + 1) / this.totalSlides) * 100;
      this.progressBar.style.width = `${progress}%`;
    }

    // 버튼 활성화 상태
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
    // 숫자 카운트업 애니메이션
    const counters = slideElement.querySelectorAll(".count-up");
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute("data-target"));
      const isPercent = counter.getAttribute("data-percent") === "true";
      const duration = 800;
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad
        const easeVal = 1 - (1 - progress) * (1 - progress);
        const currentVal = target * easeVal;

        if (isPercent) {
          counter.textContent = currentVal.toFixed(1) + "%";
        } else {
          counter.textContent = Math.round(currentVal).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          if (isPercent) {
            counter.textContent = target.toFixed(1) + "%";
          } else {
            counter.textContent = Math.round(target).toLocaleString();
          }
        }
      };

      requestAnimationFrame(updateCount);
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
    // 캔버스 기반 자체 렌더링 (외부 라이브러리 비의존)
    this.renderDonutChart("chart-publishers", [
      { label: "학회", value: 3466, color: "#3b82f6" },
      { label: "대학부설연구소", value: 2664, color: "#0ea5e9" },
      { label: "기타(일반)기관", value: 229, color: "#64748b" }
    ]);

    this.renderBarChart("chart-indexed-status", [
      { label: "우수등재", value: 67, color: "#f59e0b" },
      { label: "등재", value: 2691, color: "#3b82f6" },
      { label: "등재후보", value: 174, color: "#06b6d4" }
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
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const outerRadius = Math.min(centerX, centerY) * 0.8;
    const innerRadius = outerRadius * 0.55;

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

    // 중앙 텍스트
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px " + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total.toLocaleString()}종`, centerX, centerY - 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText("합계", centerX, centerY + 14);
  }

  renderBarChart(canvasId, items) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 30, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const maxValue = Math.max(...items.map(i => i.value)) * 1.15;
    const barWidth = Math.min(60, chartWidth / (items.length * 2));
    const step = chartWidth / items.length;

    items.forEach((item, idx) => {
      const x = padding.left + idx * step + (step - barWidth) / 2;
      const barH = (item.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barH;

      // 막대
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      // 수치 텍스트
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(item.value.toLocaleString(), x + barWidth / 2, y - 8);

      // 라벨
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
      ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 20);
    });
  }

  renderHorizontalBarChart(canvasId, items) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
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

      // 라벨
      ctx.fillStyle = "#ffffff";
      ctx.font = "13px " + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, padding.left - 15, y + barH / 2);

      // 배경 트랙 (전체 기관 수)
      const trackW = (item.total / maxTotal) * chartWidth;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(padding.left, y, trackW, barH, 4);
      ctx.fill();

      // 등재기관 수 채우기
      const fillW = (item.value / maxTotal) * chartWidth;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, fillW, barH, 4);
      ctx.fill();

      // 수치 라벨
      const ratio = ((item.value / item.total) * 100).toFixed(1);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${item.value.toLocaleString()}개 (${ratio}%)`, padding.left + fillW + 10, y + barH / 2);
    });
  }
}

// DOM 로드 완료 후 실행
document.addEventListener("DOMContentLoaded", () => {
  window.presentation = new PresentationController();
});
