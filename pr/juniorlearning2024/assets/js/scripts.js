window.addEventListener("DOMContentLoaded", function () {
  window.scrollTo(0, 0);
  //スプラッシュ画面の処理
  const splashScreen = document.querySelector(".splash");
  const appContent = document.querySelector(".wrapper");
  const body = document.body;

  let loadingComplete = false;
  let timeElapsed = false;

  // ウィンドウのロードイベントが完了したら実行
  window.onload = function () {
    loadingComplete = true;
    checkAndHideSplash();
  };

  // 2秒後に時間経過を確認
  setTimeout(() => {
    timeElapsed = true;
    checkAndHideSplash();
  }, 2000);

  // ローディング完了と2秒経過の両方が条件を満たしたらスプラッシュ画面を非表示にする
  function checkAndHideSplash() {
    if (loadingComplete && timeElapsed) {
      splashScreen.classList.add("hide");
      appContent.classList.add("show");
      animStart();
    }
  }

  //ロード後のアニメーション
  const animStart = () => {
    const animatedElements = document.querySelectorAll("[data-animation-delay]");
    let animationsCompleted = 0;
    let totalVisibleElements = 0;

    animatedElements.forEach((element) => {
      // 要素が表示されているかを確認
      if (window.getComputedStyle(element).display !== "none") {
        totalVisibleElements += 1;
        const delay = parseInt(element.getAttribute("data-animation-delay"), 10);
        const animationClass = element.getAttribute("data-animation-class");

        // 設定された時間が経過した後でクラスを付与
        setTimeout(() => {
          element.classList.add(animationClass);

          // アニメーションが完了した時に呼ばれるイベントリスナーを追加
          element.addEventListener(
            "transitionend",
            () => {
              // 表示されている要素のみカウント
              if (window.getComputedStyle(element).display !== "none") {
                animationsCompleted += 1;

                // すべてのアニメーションが完了したらno-scrollクラスを外す
                if (animationsCompleted === totalVisibleElements) {
                  document.body.classList.remove("no-scroll");
                  document.documentElement.classList.remove("no-scroll");
                }
              }
            },
            { once: true }
          );
        }, delay);
      }
    });
  };
  // Isotopeの初期化
  var iso = new Isotope(".filtr-container", {
    itemSelector: ".filtr-item",
    layoutMode: "vertical",
    transitionDuration: "0.6s", // アニメーションの持続時間
  });
  imagesLoaded(".filtr-container", function () {
    iso.layout();
  });

  window.addEventListener("resize", function () {
    iso.layout();
  });
  // フィルターを適用する関数
  function applyFilter(filterValue) {
    if (filterValue === "*") {
      iso.arrange({ filter: "*" });
    } else {
      iso.arrange({
        filter: function (itemElem) {
          const categories = itemElem.getAttribute("data-category").split(",");
          return categories.includes(filterValue);
        },
      });
    }

    // ボタンのクラスをリセットしてから、状態を更新
    const buttons = document.querySelectorAll("[data-filter]");
    buttons.forEach((btn) => {
      btn.classList.remove("is-active", "is-inactive");
      if (btn.getAttribute("data-filter") !== filterValue && filterValue !== "*") {
        btn.classList.add("is-inactive"); // 他のボタンにis-inactiveを付与
      }
    });

    // 現在のフィルターに対応するボタンにis-activeを付与
    const activeButton = document.querySelector(`[data-filter="${filterValue}"]`);
    if (activeButton && filterValue !== "*") {
      activeButton.classList.add("is-active");
    }

    // 現在のフィルターに対応するクラスを.filtr-container要素に付与
    const filtrContainer = document.querySelector(".filtr-container");
    filtrContainer.className = "filtr-container"; // 既存のクラスをリセット
    if (filterValue !== "*") {
      filtrContainer.classList.add(`filter-${filterValue}`);
    }
  }

  // 要素がビュー内にあるか確認する関数
  function isElementInView(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // 初回アクセス時にURLパラメータからフィルターを適用
  const urlParams = new URLSearchParams(window.location.search);
  let activeFilter = urlParams.get("filter") || "*"; // 現在のアクティブフィルターを初期化
  applyFilter(activeFilter);

  // フィルターボタンのクリックイベントを設定
  const buttons = document.querySelectorAll("[data-filter]");
  const localNav = document.querySelector(".intro"); // スクロールさせる位置

  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const filterValue = button.getAttribute("data-filter");

      if (button.matches(".l-header__nav__button[data-filter]")) {
        if (!isElementInView(localNav)) {
          // 要素がビュー内にない場合はスクロールしてからフィルターを適用
          const startPosition = window.pageYOffset;
          const targetPosition = localNav.getBoundingClientRect().top + startPosition;
          const duration = 300; // スクロールの時間（ミリ秒）

          const startTime = performance.now();

          function scrollAnimation(currentTime) {
            const elapsedTime = currentTime - startTime;
            const easeInOutQuad = (t) => t; // イージングをlinearに
            const run = easeInOutQuad(elapsedTime / duration) * (targetPosition - startPosition) + startPosition;

            window.scrollTo(0, run);

            if (elapsedTime < duration) {
              requestAnimationFrame(scrollAnimation);
            } else {
              executeFiltering(filterValue);
            }
          }

          requestAnimationFrame(scrollAnimation);
        } else {
          executeFiltering(filterValue);
        }
      } else {
        executeFiltering(filterValue);
      }
    });
  });

  // フィルタリングの実行関数
  function executeFiltering(filterValue) {
    if (filterValue === activeFilter) {
      // 同じボタンを再度クリックした場合、フィルターを解除
      activeFilter = "*";
      history.pushState(null, "", window.location.pathname); // URLパラメータをクリア
      applyFilter("*");
    } else {
      // 新しいフィルターを適用
      activeFilter = filterValue;
      history.pushState(null, "", `?filter=${filterValue}`);
      applyFilter(filterValue);
    }
  }

  // popstateイベントをリッスンして、ブラウザの戻る/進むボタンが押されたときにフィルタリングを再適用
  window.addEventListener("popstate", function () {
    const filterValue = new URLSearchParams(window.location.search).get("filter") || "*";
    activeFilter = filterValue; // 現在のフィルターを更新
    applyFilter(filterValue);
  });

  const navBtn = document.querySelector(".l-header__nav__toggle");
  navBtn.addEventListener("click", function () {
    this.parentElement.classList.toggle("is-active");
  });
  const headerFilterBtn = document.querySelectorAll(".l-header__nav__button");
  headerFilterBtn.forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("click");
      document.querySelector(".l-header__nav").classList.remove("is-active");
    });
  });
  document.addEventListener("scroll", function () {
    const backToTop = document.querySelector(".back-to-top-container");
    if (window.scrollY > 200) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  });
});
