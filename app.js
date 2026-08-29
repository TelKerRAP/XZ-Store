document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       CONFIGURACIÓN
    ========================================================= */

    const WHATSAPP_NUMBER = "523222373809"; 
    // Ejemplo México: 5213221234567
    // Cambia por tu número REAL, sin +, espacios ni guiones.


    /* =========================================================
       UTILIDADES
    ========================================================= */

    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const formatMoney = (number) =>
        new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0
        }).format(number);

    let cart = JSON.parse(localStorage.getItem("xz_store_cart")) || [];


    /* =========================================================
       DETECTAR PRODUCTOS DEL HTML AUTOMÁTICAMENTE
    ========================================================= */

    const productCards = $$(".product-card");

    const products = productCards.map((card, index) => {
        const nameElement = $("h4", card);
        const priceElement = $(".product-info span", card);
        const imageElement = $("img", card);
        const badgeElement = $(".product-badge", card);

        const name = nameElement ? nameElement.textContent.trim() : `Producto ${index + 1}`;

        const priceText = priceElement
            ? priceElement.textContent.replace(/[^\d.]/g, "")
            : "0";

        const price = Number(priceText);

        const image = imageElement ? imageElement.src : "";

        const badge = badgeElement
            ? badgeElement.textContent.trim()
            : "";

        // Detecta Playera o Taza por nombre/alt.
        const combinedText = (
            name + " " +
            (imageElement?.alt || "")
        ).toLowerCase();

        const category =
            combinedText.includes("taza") ||
            combinedText.includes("mug")
                ? "taza"
                : "playera";

        const id = `product-${index + 1}`;

        // Guardamos información en el HTML.
        card.dataset.productId = id;
        card.dataset.category = category;
        card.dataset.name = name.toLowerCase();

        return {
            id,
            name,
            price,
            image,
            badge,
            category
        };
    });


    /* =========================================================
       CREAR INTERFAZ AUTOMÁTICAMENTE
       BUSCADOR + FILTROS + CARRITO + TOAST
    ========================================================= */

    function injectInterface() {
        const ui = `
            <!-- BUSCADOR -->
            <div class="xz-search-overlay" id="xzSearchOverlay">
                <div class="xz-search-box">
                    <div class="xz-search-header">
                        <span>BUSCAR PRODUCTOS</span>

                        <button id="xzCloseSearch" aria-label="Cerrar">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="xz-search-input-wrap">
                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            type="search"
                            id="xzSearchInput"
                            placeholder="Busca playeras, tazas..."
                            autocomplete="off"
                        >
                    </div>

                    <div class="xz-search-results-info" id="xzSearchInfo"></div>
                </div>
            </div>


            <!-- OVERLAY CARRITO -->
            <div class="xz-cart-overlay" id="xzCartOverlay"></div>


            <!-- CARRITO -->
            <aside class="xz-cart-drawer" id="xzCartDrawer">

                <div class="xz-cart-header">
                    <div>
                        <span>MI PEDIDO</span>
                        <h2>Tu carrito</h2>
                    </div>

                    <button id="xzCloseCart" aria-label="Cerrar carrito">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>


                <div class="xz-cart-items" id="xzCartItems"></div>


                <div class="xz-cart-empty" id="xzCartEmpty">
                    <i class="fa-solid fa-bag-shopping"></i>

                    <h3>Tu carrito está vacío</h3>

                    <p>
                        Encuentra algo épico para empezar.
                    </p>

                    <button
                        class="xz-continue-shopping"
                        id="xzContinueShopping"
                    >
                        VER CATÁLOGO
                    </button>
                </div>


                <div class="xz-cart-footer" id="xzCartFooter">

                    <div class="xz-cart-total">
                        <span>SUBTOTAL</span>

                        <strong id="xzCartTotal">
                            $0 MXN
                        </strong>
                    </div>

                    <p>
                        El envío se calcula al confirmar tu pedido.
                    </p>

                    <button
                        class="xz-whatsapp-button"
                        id="xzCheckout"
                    >
                        <i class="fa-brands fa-whatsapp"></i>
                        PEDIR POR WHATSAPP
                    </button>

                    <button
                        class="xz-clear-cart"
                        id="xzClearCart"
                    >
                        Vaciar carrito
                    </button>

                </div>

            </aside>


            <!-- NOTIFICACIÓN -->
            <div class="xz-toast" id="xzToast">
                <i class="fa-solid fa-check"></i>
                <span id="xzToastText">
                    Producto agregado
                </span>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", ui);


        /* FILTROS */

        const productsHeading = $("#productos .section-heading");

        if (productsHeading) {
            const filters = document.createElement("div");

            filters.className = "xz-filters";

            filters.innerHTML = `
                <button
                    class="xz-filter active"
                    data-filter="all"
                >
                    TODO
                </button>

                <button
                    class="xz-filter"
                    data-filter="playera"
                >
                    PLAYERAS
                </button>

                <button
                    class="xz-filter"
                    data-filter="taza"
                >
                    TAZAS
                </button>
            `;

            productsHeading.appendChild(filters);
        }
    }


    injectInterface();


    /* =========================================================
       AGREGAR ESTILOS DE LA FUNCIONALIDAD
    ========================================================= */

    function injectStyles() {
        const style = document.createElement("style");

        style.textContent = `

            /* ===============================
               BOTONES Y FILTROS
            =============================== */

            .xz-filters {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                align-items: center;
                margin-left: auto;
            }

            .xz-filter {
                background: transparent;
                color: #999;
                border: 1px solid rgba(255,255,255,.12);
                padding: 10px 15px;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 1px;
                cursor: pointer;
                transition: .25s ease;
            }

            .xz-filter:hover,
            .xz-filter.active {
                color: #bd94ff;
                border-color: #9b5cff;
                background: rgba(155,92,255,.10);
            }


            /* ===============================
               BUSCADOR
            =============================== */

            .xz-search-overlay {
                position: fixed;
                inset: 0;
                z-index: 5000;

                display: flex;
                justify-content: center;
                align-items: flex-start;

                padding: 100px 20px 20px;

                background: rgba(0,0,0,.75);
                backdrop-filter: blur(10px);

                opacity: 0;
                visibility: hidden;

                transition: .3s ease;
            }

            .xz-search-overlay.open {
                opacity: 1;
                visibility: visible;
            }

            .xz-search-box {
                width: min(700px, 100%);
                background: #111219;

                border: 1px solid rgba(255,255,255,.10);

                box-shadow:
                    0 30px 100px rgba(0,0,0,.6),
                    0 0 80px rgba(155,92,255,.08);

                transform: translateY(-20px);
                transition: .3s ease;
            }

            .xz-search-overlay.open .xz-search-box {
                transform: translateY(0);
            }

            .xz-search-header {
                display: flex;
                align-items: center;
                justify-content: space-between;

                padding: 20px 25px;

                border-bottom:
                    1px solid rgba(255,255,255,.08);
            }

            .xz-search-header span {
                font-size: 10px;
                color: #bd94ff;
                font-weight: 700;
                letter-spacing: 2px;
            }

            .xz-search-header button {
                width: 38px;
                height: 38px;

                background: transparent;
                color: white;

                border: 1px solid rgba(255,255,255,.1);

                cursor: pointer;
            }

            .xz-search-input-wrap {
                display: flex;
                align-items: center;
                gap: 15px;

                padding: 25px;
            }

            .xz-search-input-wrap i {
                color: #bd94ff;
            }

            .xz-search-input-wrap input {
                width: 100%;

                background: transparent;
                border: 0;
                outline: 0;

                color: white;

                font-size: 16px;
                font-family: inherit;
            }

            .xz-search-input-wrap input::placeholder {
                color: #666;
            }

            .xz-search-results-info {
                padding: 0 25px 20px;

                color: #777;

                font-size: 11px;
            }


            /* ===============================
               CARRITO
            =============================== */

            .xz-cart-overlay {
                position: fixed;
                inset: 0;

                background: rgba(0,0,0,.65);
                backdrop-filter: blur(4px);

                z-index: 6000;

                opacity: 0;
                visibility: hidden;

                transition: .3s ease;
            }

            .xz-cart-overlay.open {
                opacity: 1;
                visibility: visible;
            }

            .xz-cart-drawer {
                position: fixed;

                top: 0;
                right: 0;

                width: min(450px, 100%);
                height: 100dvh;

                background: #0d0e14;

                border-left:
                    1px solid rgba(255,255,255,.10);

                z-index: 6001;

                display: flex;
                flex-direction: column;

                transform: translateX(100%);

                transition:
                    transform .35s cubic-bezier(.2,.8,.2,1);

                box-shadow:
                    -30px 0 100px rgba(0,0,0,.5);
            }

            .xz-cart-drawer.open {
                transform: translateX(0);
            }

            .xz-cart-header {
                display: flex;
                align-items: center;
                justify-content: space-between;

                padding: 28px;

                border-bottom:
                    1px solid rgba(255,255,255,.08);
            }

            .xz-cart-header span {
                display: block;

                color: #bd94ff;

                font-size: 9px;
                font-weight: 700;

                letter-spacing: 2px;
            }

            .xz-cart-header h2 {
                margin: 7px 0 0;

                color: white;

                font-size: 28px;
            }

            .xz-cart-header button {
                width: 42px;
                height: 42px;

                background: transparent;
                color: white;

                border:
                    1px solid rgba(255,255,255,.1);

                cursor: pointer;

                font-size: 18px;
            }

            .xz-cart-items {
                flex: 1;

                overflow-y: auto;

                padding: 20px;
            }

            .xz-cart-item {
                display: grid;

                grid-template-columns:
                    82px 1fr auto;

                gap: 15px;

                padding: 15px 0;

                border-bottom:
                    1px solid rgba(255,255,255,.08);
            }

            .xz-cart-item img {
                width: 82px;
                height: 82px;

                object-fit: cover;

                background: #08090d;
            }

            .xz-cart-item h4 {
                margin: 0 0 8px;

                color: white;

                font-size: 12px;
            }

            .xz-cart-price {
                color: #bd94ff;

                font-size: 12px;
                font-weight: 700;
            }

            .xz-quantity {
                display: flex;
                align-items: center;

                gap: 8px;

                margin-top: 12px;
            }

            .xz-quantity button {
                width: 27px;
                height: 27px;

                background: transparent;

                color: white;

                border:
                    1px solid rgba(255,255,255,.12);

                cursor: pointer;
            }

            .xz-quantity span {
                min-width: 20px;

                color: white;

                font-size: 11px;
                text-align: center;
            }

            .xz-remove-item {
                background: transparent;
                border: 0;

                color: #777;

                cursor: pointer;

                font-size: 14px;
            }

            .xz-remove-item:hover {
                color: #ff7070;
            }


            /* VACÍO */

            .xz-cart-empty {
                flex: 1;

                display: none;

                flex-direction: column;

                align-items: center;
                justify-content: center;

                text-align: center;

                padding: 40px;
            }

            .xz-cart-empty i {
                font-size: 50px;

                color: #bd94ff;

                margin-bottom: 18px;
            }

            .xz-cart-empty h3 {
                color: white;

                margin-bottom: 10px;
            }

            .xz-cart-empty p {
                color: #888;

                font-size: 12px;

                margin-bottom: 25px;
            }

            .xz-continue-shopping {
                padding: 14px 20px;

                background:
                    rgba(155,92,255,.15);

                border: 1px solid #9b5cff;

                color: #bd94ff;

                font-size: 10px;
                font-weight: 700;

                letter-spacing: 1px;

                cursor: pointer;
            }


            /* FOOTER DEL CARRITO */

            .xz-cart-footer {
                padding: 22px;

                border-top:
                    1px solid rgba(255,255,255,.08);
            }

            .xz-cart-total {
                display: flex;

                justify-content: space-between;
                align-items: center;

                margin-bottom: 10px;
            }

            .xz-cart-total span {
                color: #999;

                font-size: 10px;

                letter-spacing: 1px;
            }

            .xz-cart-total strong {
                color: white;

                font-size: 24px;
            }

            .xz-cart-footer > p {
                color: #666;

                font-size: 10px;

                margin-bottom: 18px;
            }

            .xz-whatsapp-button {
                width: 100%;

                padding: 17px;

                border: 0;

                background: #25D366;

                color: #07160c;

                font-weight: 900;

                cursor: pointer;

                letter-spacing: .8px;

                transition: .25s;
            }

            .xz-whatsapp-button:hover {
                transform: translateY(-2px);
                filter: brightness(1.08);
            }

            .xz-clear-cart {
                width: 100%;

                margin-top: 8px;

                padding: 13px;

                border: 0;

                background: transparent;

                color: #777;

                cursor: pointer;

                font-size: 10px;
            }


            /* ===============================
               NOTIFICACIÓN
            =============================== */

            .xz-toast {
                position: fixed;

                left: 50%;
                bottom: 30px;

                z-index: 7000;

                display: flex;
                align-items: center;
                gap: 10px;

                padding: 14px 20px;

                background: #171820;

                color: white;

                border:
                    1px solid rgba(155,92,255,.5);

                box-shadow:
                    0 15px 50px rgba(0,0,0,.5);

                font-size: 12px;

                transform:
                    translate(-50%, 30px);

                opacity: 0;
                visibility: hidden;

                transition: .3s ease;
            }

            .xz-toast.show {
                transform:
                    translate(-50%, 0);

                opacity: 1;
                visibility: visible;
            }

            .xz-toast i {
                color: #bd94ff;
            }


            /* ===============================
               MÓVIL
            =============================== */

            @media (max-width: 700px) {

                .xz-filters {
                    width: 100%;

                    margin: 20px 0 0;

                    order: 3;
                }

                #productos .section-heading {
                    flex-wrap: wrap;
                }

                .xz-filter {
                    flex: 1;

                    padding: 11px 8px;
                }

                .xz-cart-item {
                    grid-template-columns:
                        70px 1fr auto;
                }

                .xz-cart-item img {
                    width: 70px;
                    height: 70px;
                }
            }

        `;

        document.head.appendChild(style);
    }


    injectStyles();


    /* =========================================================
       ELEMENTOS
    ========================================================= */

    const cartButton = $(".cart-btn");
    const cartCount = $(".cart-count");

    const cartDrawer = $("#xzCartDrawer");
    const cartOverlay = $("#xzCartOverlay");

    const cartItems = $("#xzCartItems");
    const cartEmpty = $("#xzCartEmpty");
    const cartFooter = $("#xzCartFooter");
    const cartTotal = $("#xzCartTotal");

    const toast = $("#xzToast");
    const toastText = $("#xzToastText");


    /* =========================================================
       TOAST / NOTIFICACIONES
    ========================================================= */

    let toastTimer;

    function showToast(message) {
        toastText.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }


    /* =========================================================
       GUARDAR CARRITO
    ========================================================= */

    function saveCart() {
        localStorage.setItem(
            "xz_store_cart",
            JSON.stringify(cart)
        );
    }


    /* =========================================================
       ABRIR / CERRAR CARRITO
    ========================================================= */

    function openCart() {
        cartDrawer.classList.add("open");
        cartOverlay.classList.add("open");

        document.body.style.overflow = "hidden";
    }

    function closeCart() {
        cartDrawer.classList.remove("open");
        cartOverlay.classList.remove("open");

        document.body.style.overflow = "";
    }

    if (cartButton) {
        cartButton.addEventListener("click", openCart);
    }

    $("#xzCloseCart").addEventListener("click", closeCart);

    cartOverlay.addEventListener("click", closeCart);


    /* =========================================================
       AGREGAR PRODUCTO
    ========================================================= */

    function addToCart(productId) {
        const product = products.find(
            product => product.id === productId
        );

        if (!product) return;

        const existing = cart.find(
            item => item.id === productId
        );

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        saveCart();
        renderCart();

        showToast(`${product.name} agregado al carrito`);
    }


    /* =========================================================
       CAMBIAR CANTIDAD
    ========================================================= */

    function changeQuantity(productId, amount) {
        const item = cart.find(
            item => item.id === productId
        );

        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            cart = cart.filter(
                item => item.id !== productId
            );

            showToast("Producto eliminado");
        }

        saveCart();
        renderCart();
    }


    /* =========================================================
       ELIMINAR PRODUCTO
    ========================================================= */

    function removeFromCart(productId) {
        cart = cart.filter(
            item => item.id !== productId
        );

        saveCart();
        renderCart();

        showToast("Producto eliminado del carrito");
    }


    /* =========================================================
       RENDER DEL CARRITO
    ========================================================= */

    function renderCart() {
        const totalItems = cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

        const subtotal = cart.reduce(
            (total, item) =>
                total + (
                    item.price * item.quantity
                ),
            0
        );


        if (cartCount) {
            cartCount.textContent = totalItems;
        }


        cartItems.innerHTML = cart.map(item => `
            <div class="xz-cart-item">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div>

                    <h4>${item.name}</h4>

                    <div class="xz-cart-price">
                        ${formatMoney(item.price)}
                    </div>

                    <div class="xz-quantity">

                        <button
                            class="xz-qty-btn"
                            data-action="minus"
                            data-id="${item.id}"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            class="xz-qty-btn"
                            data-action="plus"
                            data-id="${item.id}"
                        >
                            +
                        </button>

                    </div>

                </div>

                <button
                    class="xz-remove-item"
                    data-remove="${item.id}"
                    aria-label="Eliminar producto"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        `).join("");


        cartTotal.textContent =
            formatMoney(subtotal);


        if (cart.length === 0) {
            cartEmpty.style.display = "flex";
            cartFooter.style.display = "none";
            cartItems.style.display = "none";
        } else {
            cartEmpty.style.display = "none";
            cartFooter.style.display = "block";
            cartItems.style.display = "block";
        }


        $$(".xz-qty-btn").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.id;

                const amount =
                    button.dataset.action === "plus"
                        ? 1
                        : -1;

                changeQuantity(id, amount);
            });
        });


        $$("[data-remove]").forEach(button => {
            button.addEventListener("click", () => {
                removeFromCart(
                    button.dataset.remove
                );
            });
        });
    }


    /* =========================================================
       BOTONES "AGREGAR AL CARRITO"
    ========================================================= */

    $$(".add-cart").forEach(button => {
        button.addEventListener("click", () => {
            const card =
                button.closest(".product-card");

            const productId =
                card.dataset.productId;

            addToCart(productId);
        });
    });


    /* =========================================================
       VACIAR CARRITO
    ========================================================= */

    $("#xzClearCart").addEventListener("click", () => {
        if (cart.length === 0) return;

        cart = [];

        saveCart();
        renderCart();

        showToast("Carrito vaciado");
    });


    /* =========================================================
       SEGUIR COMPRANDO
    ========================================================= */

    $("#xzContinueShopping").addEventListener(
        "click",
        () => {
            closeCart();

            const section =
                $("#productos");

            if (section) {
                section.scrollIntoView({
                    behavior: "smooth"
                });
            }
        }
    );


    /* =========================================================
       FILTROS
    ========================================================= */

    function filterProducts(category) {
        productCards.forEach(card => {
            const cardCategory =
                card.dataset.category;

            const show =
                category === "all" ||
                cardCategory === category;

            card.style.display =
                show ? "" : "none";
        });


        $$(".xz-filter").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === category
            );
        });
    }


    $$(".xz-filter").forEach(button => {
        button.addEventListener("click", () => {
            filterProducts(
                button.dataset.filter
            );
        });
    });


    /* =========================================================
       BOTONES DE CATEGORÍA
       VER PLAYERAS / VER TAZAS
    ========================================================= */

    const categoryButtons =
        $$(".category-card .small-btn");

    categoryButtons.forEach(button => {
        button.addEventListener("click", event => {
            const card =
                button.closest(".category-card");

            if (!card) return;

            if (
                card.id === "playeras" ||
                card.id === "tazas"
            ) {
                event.preventDefault();

                const category =
                    card.id === "tazas"
                        ? "taza"
                        : "playera";

                filterProducts(category);

                $("#productos").scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });


    /* =========================================================
       VER TODO
    ========================================================= */

    $$(".view-all").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();

            filterProducts("all");

            $("#productos").scrollIntoView({
                behavior: "smooth"
            });
        });
    });


    /* =========================================================
       BUSCADOR
    ========================================================= */

    const headerButtons =
        $$(".header-actions .icon-btn");

    const searchButton =
        headerButtons.find(button =>
            button.querySelector(
                ".fa-magnifying-glass"
            )
        );

    const searchOverlay =
        $("#xzSearchOverlay");

    const searchInput =
        $("#xzSearchInput");

    const searchInfo =
        $("#xzSearchInfo");


    function openSearch() {
        searchOverlay.classList.add("open");

        setTimeout(() => {
            searchInput.focus();
        }, 200);
    }


    function closeSearch() {
        searchOverlay.classList.remove("open");

        searchInput.value = "";

        searchInfo.textContent = "";
    }


    if (searchButton) {
        searchButton.addEventListener(
            "click",
            openSearch
        );
    }


    $("#xzCloseSearch").addEventListener(
        "click",
        closeSearch
    );


    searchOverlay.addEventListener(
        "click",
        event => {
            if (event.target === searchOverlay) {
                closeSearch();
            }
        }
    );


    searchInput.addEventListener(
        "input",
        () => {
            const term =
                searchInput.value
                    .trim()
                    .toLowerCase();

            let results = 0;

            productCards.forEach(card => {
                const name =
                    card.dataset.name || "";

                const category =
                    card.dataset.category || "";

                const match =
                    name.includes(term) ||
                    category.includes(term);

                card.style.display =
                    match ? "" : "none";

                if (match) results++;
            });


            searchInfo.textContent =
                term
                    ? `${results} producto(s) encontrado(s)`
                    : "";
        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                closeSearch();

                $("#productos").scrollIntoView({
                    behavior: "smooth"
                });
            }
        }
    );


    /* =========================================================
       MENÚ RESPONSIVE
       Solo se activa en pantallas pequeñas
    ========================================================= */

    const menu = $(".menu");
    const headerActions = $(".header-actions");

    if (menu && headerActions) {
        const mobileButton =
            document.createElement("button");

        mobileButton.className =
            "icon-btn xz-mobile-menu";

        mobileButton.innerHTML =
            '<i class="fa-solid fa-bars"></i>';

        headerActions.prepend(mobileButton);


        const mobileStyle =
            document.createElement("style");

        mobileStyle.textContent = `
            .xz-mobile-menu {
                display: none;
            }

            @media (max-width: 800px) {

                .xz-mobile-menu {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .menu {
                    position: fixed;

                    top: 80px;
                    left: 0;

                    width: 100%;

                    display: none;

                    flex-direction: column;

                    align-items: flex-start;

                    gap: 0;

                    padding: 15px 5% 25px;

                    background: #0d0e14;

                    border-bottom:
                        1px solid rgba(255,255,255,.1);

                    z-index: 4000;
                }

                .menu.open {
                    display: flex;
                }

                .menu a {
                    width: 100%;

                    padding: 15px 0;

                    border-bottom:
                        1px solid rgba(255,255,255,.05);
                }
            }
        `;

        document.head.appendChild(
            mobileStyle
        );


        mobileButton.addEventListener(
            "click",
            () => {
                menu.classList.toggle("open");

                const icon =
                    $("i", mobileButton);

                icon.className =
                    menu.classList.contains("open")
                        ? "fa-solid fa-xmark"
                        : "fa-solid fa-bars";
            }
        );


        $$("a", menu).forEach(link => {
            link.addEventListener("click", () => {
                menu.classList.remove("open");

                const icon =
                    $("i", mobileButton);

                icon.className =
                    "fa-solid fa-bars";
            });
        });
    }


    /* =========================================================
       WHATSAPP
    ========================================================= */

    $("#xzCheckout").addEventListener("click", () => {

        if (cart.length === 0) {
            showToast(
                "Tu carrito está vacío"
            );

            return;
        }


        if (
            WHATSAPP_NUMBER ===
            "521XXXXXXXXXX"
        ) {
            alert(
                "Debes configurar tu número de WhatsApp en app.js"
            );

            return;
        }


        const subtotal =
            cart.reduce(
                (total, item) =>
                    total + (
                        item.price *
                        item.quantity
                    ),
                0
            );


        const productsText =
            cart.map(item =>
                `• ${item.name} x${item.quantity} — ${formatMoney(
                    item.price * item.quantity
                )}`
            ).join("\n");


        const message = `
🔥 *NUEVO PEDIDO — XZ STORE*

${productsText}

━━━━━━━━━━━━━━
💰 *SUBTOTAL: ${formatMoney(subtotal)}*
━━━━━━━━━━━━━━

Hola, quiero realizar este pedido.
        `.trim();


        const url =
            `https://wa.me/${WHATSAPP_NUMBER}` +
            `?text=${encodeURIComponent(message)}`;


        window.open(
            url,
            "_blank"
        );
    });


    /* =========================================================
       TECLA ESC
    ========================================================= */

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeCart();
                closeSearch();
            }
        }
    );


    /* =========================================================
       INICIALIZAR
    ========================================================= */

    renderCart();

});