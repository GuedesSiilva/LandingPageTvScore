(() => {
  function initTvScore() {
    const dialog = document.querySelector("#gallery");
    const availabilityButton = document.querySelector("#availability");
    const availabilityStatus = document.querySelector("#availability-status");

    if (dialog) {
      document.querySelectorAll(".screen").forEach((button) => {
        button.addEventListener("click", () => {
          const source = button.querySelector("img");
          const image = dialog.querySelector("img");
          const caption = dialog.querySelector("p");
          if (!source || !image) return;
          const title = button.dataset.title || source.alt || "";
          image.src = source.src;
          image.alt = title;
          if (caption) caption.textContent = title;
          if (!dialog.open) dialog.showModal();
        });
      });

      dialog.querySelector(".close")?.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }

    if (availabilityButton && availabilityStatus) {
      availabilityButton.addEventListener("click", () => {
        availabilityStatus.textContent =
          "O link oficial de download estará disponível aqui em breve.";
      });
    }

    const motion = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );

    document.querySelectorAll(".cards article").forEach((card) => {
      let frameId = 0;
      let bounds = null;

      function reset() {
        cancelAnimationFrame(frameId);
        frameId = 0;
        bounds = null;
        card.classList.remove("is-hovered");
        ["--tilt-x", "--tilt-y", "--light-x", "--light-y"].forEach(
          (property) => card.style.removeProperty(property)
        );
      }

      card.addEventListener("pointerenter", () => {
        if (!motion.matches) return;
        // Mede antes da transformação para manter a inclinação estável.
        bounds = card.getBoundingClientRect();
        card.classList.add("is-hovered");
      });

      card.addEventListener("pointermove", (event) => {
        if (!motion.matches || !bounds) return;

        const x = Math.max(0, Math.min(1,
          (event.clientX - bounds.left) / bounds.width
        ));
        const y = Math.max(0, Math.min(1,
          (event.clientY - bounds.top) / bounds.height
        ));

        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          card.style.setProperty("--tilt-x", ((0.5 - y) * 10) + "deg");
          card.style.setProperty("--tilt-y", ((x - 0.5) * 10) + "deg");
          card.style.setProperty("--light-x", (x * 100) + "%");
          card.style.setProperty("--light-y", (y * 100) + "%");
        });
      });

      card.addEventListener("pointerleave", reset);
      card.addEventListener("pointercancel", reset);
      motion.addEventListener("change", reset);
      window.addEventListener("resize", reset);
      window.addEventListener("scroll", reset, { passive: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTvScore, { once: true });
  } else {
    initTvScore();
  }
})();
(() => {
  function initFaqAnimation() {
    document.querySelectorAll("#duvidas details").forEach((item) => {
      const summary = item.querySelector("summary");
      if (!summary || item.dataset.animatedFaq) return;

      item.dataset.animatedFaq = "true";

      let animation = null;
      let expanded = item.open;

      item.dataset.expanded = String(expanded);

      summary.addEventListener("click", (event) => {
        event.preventDefault();

        // Parte da altura atual, mesmo com cliques rápidos.
        const startHeight = item.getBoundingClientRect().height;

        if (animation) {
          animation.cancel();
          animation = null;
        }

        expanded = !expanded;
        item.dataset.expanded = String(expanded);

        // Mede a altura fechada.
        item.open = false;
        const closedHeight = item.getBoundingClientRect().height;

        // Mantém o conteúdo disponível durante a animação.
        item.open = true;
        const openedHeight = item.getBoundingClientRect().height;

        const currentAnimation = item.animate(
          [
            { height: `${startHeight}px` },
            {
              height: `${
                expanded ? openedHeight : closedHeight
              }px`
            }
          ],
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
          }
        );

        animation = currentAnimation;

        currentAnimation.onfinish = () => {
          if (animation !== currentAnimation) return;

          item.open = expanded;
          currentAnimation.cancel();
          animation = null;
        };
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initFaqAnimation,
      { once: true }
    );
  } else {
    initFaqAnimation();
  }
})();
(() => {
  function preserveGalleryPosition() {
    const gallery = document.querySelector("#gallery");
    if (!gallery) return;

    let scrollPosition = null;
    let openedFrom = null;

    document.querySelectorAll(".screen").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          // Guarda a posição antes de abrir a imagem.
          scrollPosition = {
            left: window.scrollX,
            top: window.scrollY
          };

          openedFrom = button;
        },
        { capture: true }
      );
    });

    gallery.addEventListener("close", () => {
      if (!scrollPosition) return;

      const position = scrollPosition;
      scrollPosition = null;

      requestAnimationFrame(() => {
        // Devolve o foco sem deslocar a página.
        if (openedFrom?.isConnected) {
          openedFrom.focus({ preventScroll: true });
        }

        window.scrollTo({
          left: position.left,
          top: position.top,
          behavior: "instant"
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      preserveGalleryPosition,
      { once: true }
    );
  } else {
    preserveGalleryPosition();
  }
})();
(() => {
  const navigation = performance.getEntriesByType("navigation")[0];

  if (navigation?.type !== "reload") return;

  history.scrollRestoration = "manual";

  // Remove a âncora, como #app, ao recarregar.
  if (window.location.hash) {
    history.replaceState(
      history.state,
      "",
      window.location.pathname + window.location.search
    );
  }

  function goToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }

  goToTop();

  window.addEventListener("pageshow", () => {
    requestAnimationFrame(goToTop);
  }, { once: true });
})();


// Revelação reversível: acompanha a entrada e a saída das seções.
(() => {
  function initPageReveal() {
    if (!("IntersectionObserver" in window)) return;
    if (typeof Element.prototype.animate !== "function") return;
    if (!CSS.supports("translate", "0 20px")) return;

    const pending = new Map();
    const sections = document.querySelectorAll("main > section, footer");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = pending.get(entry.target);
        if (!state) return;

        // A seção só desaparece quando está totalmente fora da tela.
        // Assim o texto não some enquanto ainda está sendo lido.
        const visible = entry.isIntersecting;
        if (visible === state.visible) return;
        state.visible = visible;

        state.elements.forEach((element, index) => {
          const previous = state.animations.get(element);
          const opacity = getComputedStyle(element).opacity;
          const translate = getComputedStyle(element).translate;

          if (previous) {
            previous.onfinish = null;
            previous.cancel();
          }

          const animation = element.animate(
            [
              {
                opacity,
                translate: translate === "none" ? "0 0" : translate
              },
              {
                opacity: visible ? 1 : 0,
                translate: visible ? "0 0" : "0 16px"
              }
            ],
            {
              duration: visible ? 650 : 300,
              delay: visible ? Math.min(index * 70, 280) : 0,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "both"
            }
          );

          state.animations.set(element, animation);
          if (visible) {
            animation.onfinish = () => {
              if (state.animations.get(element) !== animation) return;
              animation.cancel();
              state.animations.delete(element);
            };
          }
        });
      });
    }, { threshold: 0 });

    function revealForFocus(state) {
      state.visible = true;
      state.animations.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
      state.animations.clear();
    }

    try {
      sections.forEach((section) => {
        if (section.dataset.pageReveal) return;
        section.dataset.pageReveal = "true";

        const firstSection = section.matches(".hero, #inicio");
        let candidates;

        if (firstSection) {
          // O primeiro bloco aparece direto e só anima após sair da tela.
          // Anima o grupo, sem interferir no balanço dos celulares.
          candidates = [...section.children];
        } else {
          candidates = [...section.querySelectorAll(
            ".heading, .cards > article, .screens > .screen, " +
            ".step-list > article, .faq-list > details, " +
            ".cta > :not(.star), .gallery-note"
          )];

          if (section.matches(".steps, .faq")) {
            const intro = section.firstElementChild;
            if (intro) candidates.unshift(...intro.children);
          }
          if (section.matches("footer")) {
            candidates.push(...section.children);
          }
        }

        const unique = [...new Set(candidates)];
        const elements = unique.filter(
          (element) => !unique.some(
            (other) => other !== element && other.contains(element)
          )
        );
        if (!elements.length) elements.push(...section.children);

        const bounds = section.getBoundingClientRect();
        const initiallyVisible = firstSection ||
          (bounds.bottom > 0 && bounds.top < window.innerHeight);
        const state = {
          visible: initiallyVisible,
          elements,
          animations: new Map()
        };
        pending.set(section, state);

        if (!initiallyVisible) {
          elements.forEach((element) => {
            const animation = element.animate(
              [
                { opacity: 0, translate: "0 16px" },
                { opacity: 0, translate: "0 16px" }
              ],
              { duration: 1, fill: "both" }
            );
            animation.pause();
            state.animations.set(element, animation);
          });
        }

        // O teclado nunca fica focado em um controle invisível.
        section.addEventListener("focusin", () => revealForFocus(state));
        observer.observe(section);
      });
    } catch (error) {
      pending.forEach(revealForFocus);
      observer.disconnect();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageReveal, {
      once: true
    });
  } else {
    initPageReveal();
  }
})();

