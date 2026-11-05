// Arma las partes de la web que salen de datos.js.
(function () {
    let ingles = document.documentElement.lang === 'en';
    let textoMiniatura = ingles ? 'Thumbnail designed by VDB Designs' : 'Miniatura diseñada por VDB Designs';

    const SILUETA = '<svg xmlns="http://www.w3.org/2000/svg" width="45%" height="45%" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.5c-3.3 0-6 1.7-6 3.8V15h12v-1.7c0-2.1-2.7-3.8-6-3.8Z"/></svg>';

    function crearImagen(src, alt) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.referrerPolicy = 'no-referrer';
        return img;
    }

    function crearFoto(clase, src, alt) {
        if (src) {
            const img = crearImagen(src, alt);
            img.className = clase;
            return img;
        }
        const vacio = document.createElement('div');
        vacio.className = clase;
        vacio.innerHTML = SILUETA;
        return vacio;
    }

    // Portada: filas que se mueven lento, alternando la dirección.
    // 4 filas en computadora; en celular son 7 para que las miniaturas no queden gigantes.
    const fondo = document.getElementById('hero-fondo');
    if (fondo && MINIATURAS.length) {
        const SEGUNDOS_POR_MINIATURA = 14;
        const MINIMO_POR_VUELTA = 8; // para que nunca quede un hueco en pantallas anchas
        const FILAS = window.innerWidth <= 768 ? 7 : 4;
        fondo.parentElement.style.setProperty('--filas', FILAS);

        for (let f = 0; f < FILAS; f++) {
            // Las miniaturas se reparten entre las filas: ninguna aparece en dos filas.
            // En celular se usan solo las primeras, para que la portada cargue rápido.
            // En computadora también hay un tope: aunque sumes más miniaturas, la portada no tarda más en cargar.
            const lista = MINIATURAS.slice(0, FILAS === 4 ? 62 : FILAS * 4);
            const propias = lista.filter(function (_, i) { return i % FILAS === f; });
            const haciaIzquierda = f % 2 === 0;

            // Las que se mueven a la derecha van al revés, para que las primeras
            // de la lista (las prioritarias) sean las que se ven al entrar.
            let vuelta = propias;
            if (!haciaIzquierda) {
                const invertidas = propias.slice().reverse();
                const visibles = Math.min(4, invertidas.length);
                vuelta = invertidas.slice(-visibles).concat(invertidas.slice(0, -visibles));
            }
            while (vuelta.length < MINIMO_POR_VUELTA) vuelta = vuelta.concat(vuelta);

            const fila = document.createElement('div');
            fila.className = 'fila ' + (haciaIzquierda ? 'izquierda' : 'derecha');
            fila.style.animationDuration = (vuelta.length * SEGUNDOS_POR_MINIATURA) + 's';
            fila.setAttribute('aria-hidden', 'true');
            // La lista va duplicada: al llegar a la mitad, la animación reinicia sin que se note.
            vuelta.concat(vuelta).forEach(function (src) {
                fila.appendChild(crearImagen(src, ''));
            });
            fondo.appendChild(fila);
        }
    }

    // Portada: degradé negro sobre la parte de abajo de la pantalla, que desaparece al bajar.
    if (fondo) {
        const fundido = document.createElement('div');
        fundido.className = 'fundido-inicio';
        fundido.setAttribute('aria-hidden', 'true');
        document.body.appendChild(fundido);

        const flecha = document.createElement('button');
        flecha.type = 'button';
        flecha.className = 'flecha-abajo';
        flecha.setAttribute('aria-label', ingles ? 'Scroll down' : 'Seguir bajando');
        flecha.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5l8 8 8-8"/></svg>';
        flecha.addEventListener('click', function () {
            document.querySelector('.hero').nextElementSibling.scrollIntoView();
        });
        document.body.appendChild(flecha);

        const DISTANCIA = 260; // píxeles de scroll hasta que desaparece del todo
        function actualizarFundido() {
            const avance = Math.min(window.scrollY / DISTANCIA, 1);
            fundido.style.opacity = 1 - avance;
            fundido.style.visibility = avance >= 1 ? 'hidden' : 'visible';
            flecha.style.opacity = 1 - avance;
            flecha.style.visibility = fundido.style.visibility;
        }
        window.addEventListener('scroll', actualizarFundido, { passive: true });
        actualizarFundido();

        // El desenfoque empieza a la altura del título de clientes, para que el título se lea bien.
        function ajustarFundido() {
            const titulo = document.querySelector('.hero').nextElementSibling.querySelector('h2').getBoundingClientRect();
            const libre = window.innerHeight - (titulo.bottom + window.scrollY) + 10;
            fundido.style.maxHeight = Math.max(70, libre) + 'px';
        }
        window.addEventListener('resize', ajustarFundido);
        ajustarFundido();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarFundido);
    }

    // Evita que la página se mueva de fondo mientras hay algo abierto encima.
    let bloqueos = 0;
    function bloquearScroll() {
        if (bloqueos++ > 0) return;
        const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.paddingRight = anchoBarra + 'px';
    }
    function liberarScroll() {
        if (--bloqueos > 0) return;
        document.documentElement.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    // Visor de una miniatura: se cierra con un clic en cualquier lado, con la X o con Esc.
    let visor = null;
    let visorImagen = null;
    let visorCerrar = null;
    let origenFoco = null;
    let abierta = null;

    function crearVisor() {
        visor = document.createElement('div');
        visor.className = 'visor';
        visor.setAttribute('role', 'dialog');
        visor.setAttribute('aria-modal', 'true');
        visor.setAttribute('aria-label', textoMiniatura);
        visor.innerHTML =
            '<button type="button" class="visor-cerrar" aria-label="' + (ingles ? 'Close' : 'Cerrar') + '">&times;</button>' +
            '<img class="visor-imagen" alt="' + textoMiniatura + '">' +
            '<div class="visor-ayuda">' + (ingles ? 'Click anywhere or press Esc to close' : 'Haz clic en cualquier lado o presiona Esc para cerrar') + '</div>';
        document.body.appendChild(visor);
        visorImagen = visor.querySelector('.visor-imagen');
        visorCerrar = visor.querySelector('.visor-cerrar');
        visor.addEventListener('click', cerrarVisor);
    }

    function abrirVisor(src, item) {
        if (!visor) crearVisor();
        origenFoco = item;
        abierta = src;
        visorImagen.src = src; // se ve al instante con la versión chica...
        const grande = src.replace('miniaturas/', 'miniaturas-grandes/');
        const carga = new Image();
        carga.onload = function () { if (abierta === src) visorImagen.src = grande; }; // ...y pasa a la nítida al cargar
        carga.src = grande;
        bloquearScroll();
        visor.offsetWidth; // para que la transición se vea también la primera vez
        visor.classList.add('abierto');
        visorCerrar.focus();
    }

    function cerrarVisor() {
        if (!visor || !visor.classList.contains('abierto')) return false;
        abierta = null;
        visor.classList.remove('abierto');
        liberarScroll();
        if (origenFoco) origenFoco.focus({ preventScroll: true });
        return true;
    }

    // Página de trabajos: todas las miniaturas, con zoom al pasar el mouse.
    const galeria = document.getElementById('galeria');
    if (galeria) {
        const ZOOM = 1.6;
        const MARGEN = 12;

        MINIATURAS.forEach(function (src) {
            const item = document.createElement('div');
            item.className = 'galeria-item';
            const img = crearImagen(src, textoMiniatura);
            img.loading = 'lazy';
            item.appendChild(img);

            // Si el zoom se saldría de la pantalla, crece hacia adentro.
            item.addEventListener('pointerenter', function () {
                const anchoVentana = document.documentElement.clientWidth;
                item.style.transform = 'none'; // medir el tamaño real, sin el zoom
                const r = item.getBoundingClientRect();
                item.style.transform = '';
                // En ventanas angostas, el zoom se limita para que entre completa.
                const escala = Math.max(1, Math.min(ZOOM, (anchoVentana - MARGEN * 2) / r.width));
                item.style.setProperty('--zoom', escala);
                const extraX = r.width * (escala - 1) / 2;
                const extraY = r.height * (escala - 1) / 2;
                const x = r.left - extraX < MARGEN ? 'left' : r.right + extraX > anchoVentana - MARGEN ? 'right' : 'center';
                const y = r.top - extraY < MARGEN ? 'top' : r.bottom + extraY > window.innerHeight - MARGEN ? 'bottom' : 'center';
                item.style.transformOrigin = x + ' ' + y;
            });
            // Clic: abre la miniatura grande.
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', ingles ? 'Open thumbnail' : 'Abrir miniatura');
            item.addEventListener('click', function () { abrirVisor(src, item); });
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrirVisor(src, item);
                }
            });
            galeria.appendChild(item);
        });
    }

    // Clientes: quietos, y al hacer clic en uno se abren los trabajos que tenga cargados en datos.js.
    let panel = null;
    let panelTitulo = null;
    let panelTrabajos = null;
    let panelCerrar = null;
    let origenPanel = null;

    function crearPanel() {
        panel = document.createElement('div');
        panel.className = 'panel-cliente';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.innerHTML =
            '<button type="button" class="visor-cerrar"></button>' +
            '<div class="panel-cliente-caja"><h3 class="panel-cliente-titulo"></h3><div class="panel-cliente-trabajos"></div></div>';
        document.body.appendChild(panel);
        panelTitulo = panel.querySelector('.panel-cliente-titulo');
        panelTrabajos = panel.querySelector('.panel-cliente-trabajos');
        panelCerrar = panel.querySelector('.visor-cerrar');
        panelCerrar.innerHTML = '&times;';
        panelCerrar.addEventListener('click', cerrarPanel);
        panel.addEventListener('click', function (e) {
            if (e.target === panel) cerrarPanel(); // clic afuera de la caja
        });
    }

    function abrirPanel(cliente, bloque) {
        if (!panel) crearPanel();
        origenPanel = bloque;
        panelCerrar.setAttribute('aria-label', ingles ? 'Close' : 'Cerrar');
        panel.setAttribute('aria-label', (ingles ? 'Work for ' : 'Trabajos para ') + cliente.canal);
        panelTitulo.textContent = ingles ? 'Work for ' : 'Trabajos para ';
        const nombre = document.createElement('em');
        nombre.textContent = cliente.canal;
        panelTitulo.appendChild(nombre);
        panelTrabajos.textContent = '';
        cliente.trabajos.forEach(function (src) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'panel-cliente-item';
            boton.setAttribute('aria-label', ingles ? 'Open thumbnail' : 'Abrir miniatura');
            boton.appendChild(crearImagen(src, textoMiniatura));
            boton.addEventListener('click', function () { abrirVisor(src, boton); });
            panelTrabajos.appendChild(boton);
        });
        bloquearScroll();
        panel.scrollTop = 0;
        panel.offsetWidth; // para que la transición se vea también la primera vez
        panel.classList.add('abierto');
        panelCerrar.focus();
    }

    function cerrarPanel() {
        if (!panel || !panel.classList.contains('abierto')) return false;
        panel.classList.remove('abierto');
        liberarScroll();
        if (origenPanel) origenPanel.focus({ preventScroll: true });
        return true;
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') cerrarVisor() || cerrarPanel();
    });

    const clientes = document.getElementById('clientes-grid');
    if (clientes && CLIENTES.length) {
        CLIENTES.forEach(function (cliente) {
            const bloque = document.createElement('div');
            bloque.className = 'cliente';
            bloque.appendChild(crearFoto('cliente-foto', cliente.foto, cliente.canal));
            const canal = document.createElement('div');
            canal.className = 'cliente-canal';
            canal.textContent = cliente.canal;
            bloque.appendChild(canal);

            if (cliente.trabajos && cliente.trabajos.length) {
                bloque.classList.add('con-trabajos');
                bloque.tabIndex = 0;
                bloque.setAttribute('role', 'button');
                bloque.dataset.canal = cliente.canal;
                bloque.setAttribute('aria-label', (ingles ? 'See work for ' : 'Ver trabajos para ') + cliente.canal);
                bloque.addEventListener('click', function () { abrirPanel(cliente, bloque); });
                bloque.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        abrirPanel(cliente, bloque);
                    }
                });
            }
            clientes.appendChild(bloque);
        });

        // Una sola fila: se desliza con las flechas, arrastrando con el mouse o con el dedo.
        const carrusel = clientes.parentElement;
        const marco = document.createElement('div');
        marco.className = 'clientes-marco';
        carrusel.replaceWith(marco);
        marco.appendChild(carrusel);

        function crearFlechaClientes(clase, trazo, sentido) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'clientes-flecha ' + clase;
            boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + trazo + '"/></svg>';
            boton.addEventListener('click', function () {
                // Avanza de a clientes enteros, dejando uno a la vista para no perder el hilo.
                const paso = clientes.querySelector('.cliente').offsetWidth + parseFloat(getComputedStyle(clientes).columnGap);
                const entran = Math.max(1, Math.floor(carrusel.clientWidth / paso) - 1);
                carrusel.scrollBy({ left: sentido * entran * paso });
            });
            marco.appendChild(boton);
            return boton;
        }
        const flechaAnterior = crearFlechaClientes('anterior', 'M15 5l-7 7 7 7', -1);
        const flechaSiguiente = crearFlechaClientes('siguiente', 'M9 5l7 7-7 7', 1);
        textosFlechasClientes();

        function actualizarFlechasClientes() {
            const hayIzquierda = carrusel.scrollLeft > 4;
            const hayDerecha = carrusel.scrollLeft + carrusel.clientWidth < carrusel.scrollWidth - 4;
            flechaAnterior.classList.toggle('visible', hayIzquierda);
            flechaSiguiente.classList.toggle('visible', hayDerecha);
            marco.classList.toggle('hay-izquierda', hayIzquierda);
            marco.classList.toggle('hay-derecha', hayDerecha);
        }
        // La primera flecha ya aparece puesta; recién al deslizar se anima.
        marco.classList.add('sin-transicion');
        carrusel.addEventListener('scroll', function () {
            marco.classList.remove('sin-transicion');
            actualizarFlechasClientes();
        }, { passive: true });
        new ResizeObserver(actualizarFlechasClientes).observe(carrusel);
        actualizarFlechasClientes();

        // Arrastre con el mouse. Con el dedo ya lo hace el navegador.
        let apretado = false;
        let arrastrado = false;
        let inicioX = 0;
        let inicioScroll = 0;
        carrusel.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            apretado = true;
            arrastrado = false;
            inicioX = e.clientX;
            inicioScroll = carrusel.scrollLeft;
        });
        carrusel.addEventListener('pointermove', function (e) {
            if (!apretado) return;
            const movido = e.clientX - inicioX;
            if (!arrastrado && Math.abs(movido) > 6) {
                arrastrado = true;
                carrusel.classList.add('arrastrando');
                carrusel.setPointerCapture(e.pointerId);
            }
            if (arrastrado) carrusel.scrollLeft = inicioScroll - movido;
        });
        function soltarClientes() {
            apretado = false;
            carrusel.classList.remove('arrastrando');
        }
        carrusel.addEventListener('pointerup', soltarClientes);
        carrusel.addEventListener('pointercancel', soltarClientes);
        carrusel.addEventListener('dragstart', function (e) { e.preventDefault(); });
        // Si se estaba arrastrando, soltar el mouse no abre al cliente que quedó debajo.
        carrusel.addEventListener('click', function (e) {
            if (!arrastrado) return;
            arrastrado = false;
            e.stopPropagation();
            e.preventDefault();
        }, true);
    }

    function textosFlechasClientes() {
        const anterior = document.querySelector('.clientes-flecha.anterior');
        const siguiente = document.querySelector('.clientes-flecha.siguiente');
        if (anterior) anterior.setAttribute('aria-label', ingles ? 'Previous clients' : 'Clientes anteriores');
        if (siguiente) siguiente.setAttribute('aria-label', ingles ? 'More clients' : 'Más clientes');
    }

    // Foto de "Sobre mí".
    const lugarFoto = document.getElementById('mi-foto');
    if (lugarFoto) {
        lugarFoto.replaceWith(crearFoto('mi-foto', MI_FOTO, ingles ? 'Photo of the designer behind VDB Designs' : 'Foto de quien está detrás de VDB Designs'));
    }

    // Cambio de idioma sin recargar: se trae la otra versión de la página y se copian solo sus textos.
    // El fondo, el carrusel, la posición en la página y lo escrito en el formulario no se tocan.
    const PARTES_CON_TEXTO = '.nav-logo, .nav-link, .lang-control, .badge, h1, .subtitle, .btn, .section-header, .sobre-mi-texto, .form-label, .form-input, .trabajos-cta > p, footer > p';
    const paginas = new Map();
    let rutaActual = location.pathname;
    let ultimoPedido = 0;

    function traerPagina(url) {
        if (!paginas.has(url)) {
            paginas.set(url, fetch(url).then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            }).then(function (html) {
                return new DOMParser().parseFromString(html, 'text/html');
            }).catch(function (error) {
                paginas.delete(url); // si falló, que se pueda volver a intentar
                throw error;
            }));
        }
        return paginas.get(url);
    }

    function copiarTextos(nueva) {
        const actuales = document.querySelectorAll(PARTES_CON_TEXTO);
        const nuevas = nueva.querySelectorAll(PARTES_CON_TEXTO);
        const secciones = document.querySelectorAll('section');
        const seccionesNuevas = nueva.querySelectorAll('section');
        if (actuales.length !== nuevas.length || secciones.length !== seccionesNuevas.length) return false;

        actuales.forEach(function (el, i) {
            const otro = nuevas[i];
            if (otro.hasAttribute('href')) el.setAttribute('href', otro.getAttribute('href'));
            if (otro.hasAttribute('placeholder')) el.setAttribute('placeholder', otro.getAttribute('placeholder'));
            if (!el.matches('.form-input') && el.innerHTML !== otro.innerHTML) el.innerHTML = otro.innerHTML;
        });
        secciones.forEach(function (seccion, i) {
            const id = seccionesNuevas[i].getAttribute('id');
            if (id) seccion.id = id;
        });

        document.documentElement.lang = nueva.documentElement.lang;
        document.title = nueva.title;
        ingles = nueva.documentElement.lang === 'en';
        textoMiniatura = ingles ? 'Thumbnail designed by VDB Designs' : 'Miniatura diseñada por VDB Designs';

        // Textos que arma este archivo
        const foto = document.querySelector('.mi-foto');
        if (foto) foto.setAttribute('alt', ingles ? 'Photo of the designer behind VDB Designs' : 'Foto de quien está detrás de VDB Designs');
        document.querySelectorAll('.galeria-item').forEach(function (item) {
            item.setAttribute('aria-label', ingles ? 'Open thumbnail' : 'Abrir miniatura');
            item.querySelector('img').alt = textoMiniatura;
        });
        const flecha = document.querySelector('.flecha-abajo');
        if (flecha) flecha.setAttribute('aria-label', ingles ? 'Scroll down' : 'Seguir bajando');
        textosFlechasClientes();
        document.querySelectorAll('.cliente.con-trabajos').forEach(function (bloque) {
            bloque.setAttribute('aria-label', (ingles ? 'See work for ' : 'Ver trabajos para ') + bloque.dataset.canal);
        });
        if (visor) {
            visor.setAttribute('aria-label', textoMiniatura);
            visor.querySelector('.visor-imagen').alt = textoMiniatura;
            visor.querySelector('.visor-cerrar').setAttribute('aria-label', ingles ? 'Close' : 'Cerrar');
            visor.querySelector('.visor-ayuda').textContent = ingles ? 'Click anywhere or press Esc to close' : 'Haz clic en cualquier lado o presiona Esc para cerrar';
        }
        return true;
    }

    function cambiarIdioma(url, agregarAlHistorial) {
        const pedido = ++ultimoPedido;
        const destino = new URL(url, location.href);
        traerPagina(destino.pathname).then(function (nueva) {
            if (pedido !== ultimoPedido) return; // ya se pidió otro cambio mientras tanto

            // Si la dirección apunta a una sección (#clientes), pasa a la misma sección del otro idioma (#clients).
            const indice = Array.from(document.querySelectorAll('section')).findIndex(function (s) {
                return s.id && '#' + s.id === location.hash;
            });
            const seccionNueva = indice >= 0 ? nueva.querySelectorAll('section')[indice] : null;
            const teniaFoco = document.activeElement && document.activeElement.closest('.lang-control');

            if (!copiarTextos(nueva)) {
                location.href = destino.href;
                return;
            }
            rutaActual = destino.pathname;
            if (agregarAlHistorial) {
                history.pushState(null, '', destino.pathname + (seccionNueva && seccionNueva.id ? '#' + seccionNueva.id : ''));
            }
            if (teniaFoco) {
                const boton = document.querySelector('.lang-control a');
                if (boton) boton.focus({ preventScroll: true });
            }
        }).catch(function () {
            location.href = destino.href; // sin conexión con la otra versión: se navega de la forma normal
        });
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        const enlace = e.target.closest('.lang-control a');
        if (!enlace) return;
        e.preventDefault();
        cambiarIdioma(enlace.href, true);
    });

    // Se adelanta la descarga al pasar el mouse, para que el cambio sea instantáneo.
    function adelantarDescarga(e) {
        const enlace = e.target.closest && e.target.closest('.lang-control a');
        if (enlace) traerPagina(new URL(enlace.href).pathname).catch(function () {});
    }
    document.addEventListener('pointerover', adelantarDescarga, { passive: true });
    document.addEventListener('focusin', adelantarDescarga);

    // Botones atrás/adelante del navegador
    window.addEventListener('popstate', function () {
        if (location.pathname !== rutaActual) cambiarIdioma(location.href, false);
    });
})();
