// Arma las partes de la web que salen de datos.js.
(function () {
    const ingles = document.documentElement.lang === 'en';
    const textoMiniatura = ingles ? 'Thumbnail designed by VDB Designs' : 'Miniatura diseñada por VDB Designs';

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
            galeria.appendChild(item);
        });
    }

    // Clientes: una sola línea que pasa en loop infinito.
    const clientes = document.getElementById('clientes-grid');
    if (clientes && CLIENTES.length) {
        const SEGUNDOS_POR_CLIENTE = 5;
        const MINIMO_POR_VUELTA = 16; // para que nunca quede un hueco en pantallas anchas

        let vuelta = CLIENTES;
        while (vuelta.length < MINIMO_POR_VUELTA) vuelta = vuelta.concat(CLIENTES);
        clientes.style.animationDuration = (vuelta.length * SEGUNDOS_POR_CLIENTE) + 's';

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
    }

    // Foto de "Sobre mí".
    const lugarFoto = document.getElementById('mi-foto');
    if (lugarFoto) {
        lugarFoto.replaceWith(crearFoto('mi-foto', MI_FOTO, ingles ? 'Photo of the designer behind VDB Designs' : 'Foto de quien está detrás de VDB Designs'));
    }
})();
