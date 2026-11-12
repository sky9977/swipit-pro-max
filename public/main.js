/**
 * SWIPIT — Core Interactive Experience Controller
 * Synchronized Video Dual-Layering, 3D Card Physics, Finish Switcher,
 * Motion-aware Brand Overlay, and Fluid Apple-style Navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDualLayerVideo();
  initCardBrandOverlayTracking();
  initNavigation();
  init3DCardStage();
  initFinishSwitcher();
  initInteractions();
});

/* ==========================================================================
   1. DUAL-LAYER SYNCHRONIZED VIDEO PLAYBACK CONTROLLER
   Layers the crisp, uncropped original video in front of a synchronized,
   heavily blurred widescreen video background.
   ========================================================================== */
function initDualLayerVideo() {
  const heroVideo = document.getElementById('heroVideo');
  const blurredHeroVideo = document.getElementById('blurredHeroVideo');

  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const soundMutedIcon = document.getElementById('soundMutedIcon');
  const soundUnmutedIcon = document.getElementById('soundUnmutedIcon');
  const audioStatusText = document.getElementById('audioStatusText');

  const playPauseToggleBtn = document.getElementById('playPauseToggleBtn');
  const pauseIcon = document.getElementById('pauseIcon');
  const playIcon = document.getElementById('playIcon');

  if (!heroVideo) return;

  // Enforce autoplay standard attributes
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.playsInline = true;

  if (blurredHeroVideo) {
    blurredHeroVideo.muted = true;
    blurredHeroVideo.defaultMuted = true;
    blurredHeroVideo.playsInline = true;
  }

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const syncPlay = () => {
    if (prefersReducedMotion) {
      heroVideo.pause();
      if (blurredHeroVideo) blurredHeroVideo.pause();
      updatePlayPauseState(false);
      return;
    }

    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (blurredHeroVideo) blurredHeroVideo.play().catch(() => {});
          updatePlayPauseState(true);
        })
        .catch((err) => {
          console.warn('[SWIPIT] Autoplay blocked, awaiting user gesture:', err);
          updatePlayPauseState(false);
          const playOnGesture = () => {
            heroVideo.play().then(() => {
              if (blurredHeroVideo) blurredHeroVideo.play().catch(() => {});
              updatePlayPauseState(true);
            }).catch(() => {});
            document.removeEventListener('click', playOnGesture);
            document.removeEventListener('touchstart', playOnGesture);
          };
          document.addEventListener('click', playOnGesture, { once: true });
          document.addEventListener('touchstart', playOnGesture, { once: true });
        });
    }
  };

  syncPlay();

  // Continuous sync between foreground and background video
  if (blurredHeroVideo) {
    heroVideo.addEventListener('timeupdate', () => {
      if (Math.abs(blurredHeroVideo.currentTime - heroVideo.currentTime) > 0.25) {
        blurredHeroVideo.currentTime = heroVideo.currentTime;
      }
    });

    heroVideo.addEventListener('seeking', () => {
      blurredHeroVideo.currentTime = heroVideo.currentTime;
    });

    heroVideo.addEventListener('pause', () => {
      blurredHeroVideo.pause();
    });

    heroVideo.addEventListener('play', () => {
      blurredHeroVideo.play().catch(() => {});
    });
  }

  function updatePlayPauseState(isPlaying) {
    if (isPlaying) {
      pauseIcon?.classList.remove('hidden');
      playIcon?.classList.add('hidden');
    } else {
      pauseIcon?.classList.add('hidden');
      playIcon?.classList.remove('hidden');
    }
  }

  // Audio Toggle
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (heroVideo.muted) {
        heroVideo.muted = false;
        soundMutedIcon?.classList.add('hidden');
        soundUnmutedIcon?.classList.remove('hidden');
        if (audioStatusText) audioStatusText.textContent = 'Audio On';
        showToast('🔊 Audio enabled');
      } else {
        heroVideo.muted = true;
        soundMutedIcon?.classList.remove('hidden');
        soundUnmutedIcon?.classList.add('hidden');
        if (audioStatusText) audioStatusText.textContent = 'Muted';
        showToast('🔇 Audio muted');
      }
    });
  }

  // Play / Pause Toggle
  if (playPauseToggleBtn) {
    playPauseToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (heroVideo.paused) {
        heroVideo.play();
        if (blurredHeroVideo) blurredHeroVideo.play().catch(() => {});
        updatePlayPauseState(true);
        showToast('▶ Video resumed');
      } else {
        heroVideo.pause();
        if (blurredHeroVideo) blurredHeroVideo.pause();
        updatePlayPauseState(false);
        showToast('⏸ Video paused');
      }
    });
  }

  // Pause when scrolled out of view to preserve device GPU & battery
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          if (!heroVideo.paused) heroVideo.pause();
          if (blurredHeroVideo && !blurredHeroVideo.paused) blurredHeroVideo.pause();
        } else {
          if (heroVideo.paused && pauseIcon && !pauseIcon.classList.contains('hidden')) {
            heroVideo.play().catch(() => {});
            if (blurredHeroVideo) blurredHeroVideo.play().catch(() => {});
          }
        }
      });
    },
    { threshold: 0.15 }
  );

  const heroSection = document.getElementById('hero');
  if (heroSection) heroObserver.observe(heroSection);
}

/* ==========================================================================
   2. CARD BRAND OVERLAY PERSPECTIVE TRACKING
   Ensures SWIPIT is prominently and naturally associated with the card.
   ========================================================================== */
function initCardBrandOverlayTracking() {
  const overlay = document.getElementById('cardBrandOverlay');
  const video = document.getElementById('heroVideo');

  if (!overlay || !video) return;

  // Modulate overlay presence smoothly based on video progression
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    // Keep subtle glass overlay softly visible during resting/reveal phases
    const opacity = 0.85 + Math.sin(t * 1.5) * 0.15;
    overlay.style.opacity = String(opacity);
  });
}

/* ==========================================================================
   3. NAVIGATION CONTROLLER
   Transparent navigation, scroll-activated frosted blur, and mobile drawer.
   ========================================================================== */
function initNavigation() {
  const header = document.getElementById('siteHeader');
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const navLinks = document.querySelectorAll('.nav-link');

  const onScroll = () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu drawer
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpen);
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Active section tracking
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach((sec) => {
      const sectionHeight = sec.offsetHeight;
      const sectionTop = sec.offsetTop - 100;
      const sectionId = sec.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
        });
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   4. 3D CARD INTERACTIVE TILT (SECTION 1)
   Physics-based 3D tilt tracking cursor and touch movements with specular glare.
   ========================================================================== */
function init3DCardStage() {
  const cardWrapper = document.getElementById('card3D');
  const cardSurface = document.getElementById('cardSurface');
  const cardGlare = document.getElementById('cardGlare');

  if (!cardWrapper || !cardSurface || !cardGlare) return;

  let bounds;

  function recalculateBounds() {
    bounds = cardWrapper.getBoundingClientRect();
  }

  window.addEventListener('resize', recalculateBounds, { passive: true });
  window.addEventListener('scroll', recalculateBounds, { passive: true });
  recalculateBounds();

  function onMove(e) {
    if (!bounds) recalculateBounds();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const mouseX = clientX - bounds.left;
    const mouseY = clientY - bounds.top;

    const xRatio = mouseX / bounds.width;
    const yRatio = mouseY / bounds.height;

    const rotateY = (xRatio - 0.5) * 26;
    const rotateX = (0.5 - yRatio) * 26;

    cardSurface.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(16px)`;

    cardGlare.style.opacity = '1';
    cardGlare.style.background = `radial-gradient(circle at ${(xRatio * 100).toFixed(1)}% ${(yRatio * 100).toFixed(1)}%, rgba(255, 255, 255, 0.28) 0%, transparent 65%)`;
  }

  function onLeave() {
    cardSurface.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
    cardGlare.style.opacity = '0';
  }

  cardWrapper.addEventListener('mousemove', onMove);
  cardWrapper.addEventListener('mouseleave', onLeave);
  cardWrapper.addEventListener('touchmove', onMove, { passive: true });
  cardWrapper.addEventListener('touchend', onLeave);
}

/* ==========================================================================
   5. MATERIAL & FINISH SWITCHER
   ========================================================================== */
function initFinishSwitcher() {
  const finishButtons = document.querySelectorAll('.finish-btn');
  const cardSurface = document.getElementById('cardSurface');
  const cardFinishTag = document.getElementById('cardFinishTag');

  if (!finishButtons.length || !cardSurface) return;

  const finishes = {
    titanium: {
      tag: 'TITANIUM EDITION',
      bg: 'linear-gradient(135deg, #2b2e38 0%, #15161c 50%, #0d0e13 100%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      shadow: '0 30px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(96, 165, 250, 0.1)'
    },
    obsidian: {
      tag: 'OBSIDIAN BLACK EDITION',
      bg: 'linear-gradient(135deg, #17181f 0%, #0c0d12 50%, #040406 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 30px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 255, 255, 0.05)'
    },
    platinum: {
      tag: 'CYBER PLATINUM EDITION',
      bg: 'linear-gradient(135deg, #e4e4e7 0%, #9ca3af 35%, #4b5563 70%, #181920 100%)',
      border: '1px solid rgba(255, 255, 255, 0.45)',
      shadow: '0 30px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(228, 228, 231, 0.2)'
    }
  };

  finishButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const finishKey = btn.getAttribute('data-finish');
      const cfg = finishes[finishKey];
      if (!cfg) return;

      finishButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      cardSurface.style.background = cfg.bg;
      cardSurface.style.border = cfg.border;
      cardSurface.style.boxShadow = cfg.shadow;

      if (cardFinishTag) cardFinishTag.textContent = cfg.tag;
      showToast(`Selected ${cfg.tag}`);
    });
  });
}

/* ==========================================================================
   6. USER INTERACTIONS, FORMS & TOAST NOTIFICATIONS
   ========================================================================== */
function initInteractions() {
  const getStartedBtns = [
    document.getElementById('navGetStartedBtn'),
    document.getElementById('heroGetStartedBtn'),
    document.getElementById('mobileCtaBtn')
  ];

  const loginBtns = [
    document.getElementById('loginBtn'),
    document.getElementById('mobileLoginBtn')
  ];

  const signupForm = document.getElementById('signupForm');
  const userEmailInput = document.getElementById('userEmailInput');

  getStartedBtns.forEach((btn) => {
    btn?.addEventListener('click', () => {
      const emailField = document.getElementById('userEmailInput');
      if (emailField) {
        emailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => emailField.focus(), 600);
      }
      showToast('⚡ Reserve your SWIPIT card below');
    });
  });

  loginBtns.forEach((btn) => {
    btn?.addEventListener('click', () => {
      showToast('🔒 Account authentication portal');
    });
  });

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = userEmailInput?.value.trim();
    if (email) {
      showToast(`🎉 Priority invitation reserved for ${email}`);
      if (userEmailInput) userEmailInput.value = '';
    }
  });
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
