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
            const lista = FILAS === 4 ? MINIATURAS : MINIATURAS.slice(0, FILAS * 4);
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

        const DISTANCIA = 260; // píxeles de scroll hasta que desaparece del todo
        function actualizarFundido() {
            const avance = Math.min(window.scrollY / DISTANCIA, 1);
            fundido.style.opacity = 1 - avance;
            fundido.style.visibility = avance >= 1 ? 'hidden' : 'visible';
        }
        window.addEventListener('scroll', actualizarFundido, { passive: true });
        actualizarFundido();
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

        // Visor: se cierra con un clic en cualquier lado, con la X o con Esc.
        const visor = document.createElement('div');
        visor.className = 'visor';
        visor.setAttribute('role', 'dialog');
        visor.setAttribute('aria-modal', 'true');
        visor.setAttribute('aria-label', textoMiniatura);
        visor.innerHTML =
            '<button type="button" class="visor-cerrar" aria-label="' + (ingles ? 'Close' : 'Cerrar') + '">&times;</button>' +
            '<img class="visor-imagen" alt="' + textoMiniatura + '">' +
            '<div class="visor-ayuda">' + (ingles ? 'Click anywhere or press Esc to close' : 'Haz clic en cualquier lado o presiona Esc para cerrar') + '</div>';
        document.body.appendChild(visor);
        const visorImagen = visor.querySelector('.visor-imagen');
        const visorCerrar = visor.querySelector('.visor-cerrar');
        let origenFoco = null;
        let abierta = null;

        function abrirVisor(src, item) {
            origenFoco = item;
            abierta = src;
            visorImagen.src = src; // se ve al instante con la versión chica...
            const grande = src.replace('miniaturas/', 'miniaturas-grandes/');
            const carga = new Image();
            carga.onload = function () { if (abierta === src) visorImagen.src = grande; }; // ...y pasa a la nítida al cargar
            carga.src = grande;
            const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.paddingRight = anchoBarra + 'px';
            visor.classList.add('abierto');
            visorCerrar.focus();
        }

        function cerrarVisor() {
            if (!visor.classList.contains('abierto')) return;
            abierta = null;
            visor.classList.remove('abierto');
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '';
            if (origenFoco) origenFoco.focus({ preventScroll: true });
        }

        visor.addEventListener('click', cerrarVisor);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrarVisor();
        });
    }

    // Clientes: una sola línea en loop infinito que avanza muy lento.
    // Con el mouse en los costados se acelera hacia ese lado, y también se puede arrastrar (con mouse o dedo).
    const clientes = document.getElementById('clientes-grid');
    if (clientes && CLIENTES.length) {
        const MINIMO_POR_VUELTA = 16; // para que nunca quede un hueco en pantallas anchas

        let vuelta = CLIENTES;
        while (vuelta.length < MINIMO_POR_VUELTA) vuelta = vuelta.concat(CLIENTES);

        // La lista va duplicada: al llegar a la mitad, la animación reinicia sin que se note.
        vuelta.concat(vuelta).forEach(function (cliente, i) {
            const bloque = document.createElement('div');
            bloque.className = 'cliente';
            if (i >= CLIENTES.length) bloque.setAttribute('aria-hidden', 'true'); // las copias no se leen dos veces
            bloque.appendChild(crearFoto('cliente-foto', cliente.foto, cliente.canal));
            const canal = document.createElement('div');
            canal.className = 'cliente-canal';
            canal.textContent = cliente.canal;
            bloque.appendChild(canal);
            clientes.appendChild(bloque);
        });

        const VELOCIDAD_LENTA = 14; // píxeles por segundo cuando nadie lo toca
        const VELOCIDAD_COSTADOS = 480; // píxeles por segundo con el mouse en el borde de la pantalla
        const ZONA_CENTRAL = 0.5; // en esta parte del medio el mouse no acelera (así se puede mirar a cada cliente)
        const INERCIA_MAXIMA = 2500;
        const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
        const carrusel = clientes.parentElement;

        let posicion = 0;
        let velocidad = sinMovimiento.matches ? 0 : -VELOCIDAD_LENTA;
        let mitad = clientes.offsetWidth / 2;
        let mouseX = null;
        let arrastrando = false;
        let ultimoX = 0;
        let ultimoTiempoArrastre = 0;
        let anterior = performance.now();

        new ResizeObserver(function () { mitad = clientes.offsetWidth / 2; }).observe(clientes);

        function velocidadBuscada() {
            if (sinMovimiento.matches) return 0;
            if (mouseX !== null) {
                const desdeElCentro = (mouseX / window.innerWidth - 0.5) * 2; // -1 a la izquierda, 1 a la derecha
                const fuerza = (Math.abs(desdeElCentro) - ZONA_CENTRAL) / (1 - ZONA_CENTRAL);
                // Mouse a la derecha: los círculos van a la izquierda, para ver los que siguen.
                if (fuerza > 0) return -Math.sign(desdeElCentro) * VELOCIDAD_COSTADOS * fuerza * fuerza;
            }
            return -VELOCIDAD_LENTA;
        }

        function animarClientes(ahora) {
            const pasado = Math.min((ahora - anterior) / 1000, 0.05); // al volver de otra pestaña no pega un salto
            anterior = ahora;
            if (!arrastrando) {
                velocidad += (velocidadBuscada() - velocidad) * (1 - Math.exp(-pasado * 3.5));
                posicion += velocidad * pasado;
            }
            if (mitad > 0) {
                while (posicion <= -mitad) posicion += mitad;
                while (posicion > 0) posicion -= mitad;
            }
            clientes.style.transform = 'translate3d(' + posicion + 'px, 0, 0)';
            requestAnimationFrame(animarClientes);
        }
        requestAnimationFrame(animarClientes);

        function soltar() {
            if (!arrastrando) return;
            arrastrando = false;
            carrusel.classList.remove('arrastrando');
            mouseX = null; // no acelera hasta que el mouse se vuelva a mover
        }

        carrusel.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            arrastrando = true;
            carrusel.classList.add('arrastrando');
            carrusel.setPointerCapture(e.pointerId);
            ultimoX = e.clientX;
            ultimoTiempoArrastre = e.timeStamp;
            velocidad = 0;
        });
        carrusel.addEventListener('pointermove', function (e) {
            if (arrastrando) {
                const movido = e.clientX - ultimoX;
                const tiempo = Math.max((e.timeStamp - ultimoTiempoArrastre) / 1000, 0.001);
                posicion += movido;
                // Al soltar sigue un poco con la velocidad que traía.
                const actual = Math.max(-INERCIA_MAXIMA, Math.min(INERCIA_MAXIMA, movido / tiempo));
                velocidad = velocidad * 0.6 + actual * 0.4;
                ultimoX = e.clientX;
                ultimoTiempoArrastre = e.timeStamp;
            } else if (e.pointerType === 'mouse') {
                mouseX = e.clientX;
            }
        });
        carrusel.addEventListener('pointerup', function (e) {
            if (e.timeStamp - ultimoTiempoArrastre > 120) velocidad = 0; // lo dejó quieto antes de soltar
            soltar();
        });
        carrusel.addEventListener('pointercancel', soltar);
        carrusel.addEventListener('pointerleave', function () { if (!arrastrando) mouseX = null; });
        carrusel.addEventListener('dragstart', function (e) { e.preventDefault(); });
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
        const visor = document.querySelector('.visor');
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
