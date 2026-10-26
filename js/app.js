"use strict";

const BibliotecaApp = (() => {
    const normalizar = (texto = "") => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const CLAVES = { usuarios: "biblioteca.usuarios", libros: "biblioteca.libros", prestamos: "biblioteca.prestamos", devoluciones: "biblioteca.devoluciones" };

    const leerDatos = (clave) => {
        try { return JSON.parse(localStorage.getItem(clave) || "[]"); }
        catch { return []; }
    };

    const guardarDatos = (clave, datos) => {
        try { localStorage.setItem(clave, JSON.stringify(datos)); }
        catch { /* La interfaz sigue funcionando aunque el navegador bloquee el almacenamiento. */ }
    };

    const escapar = (valor = "") => String(valor).replace(/[&<>'"]/g, (caracter) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[caracter]);

    const avisar = (mensaje) => {
        let aviso = document.querySelector("#aviso-aplicacion");
        if (!aviso) {
            aviso = document.createElement("div");
            aviso.id = "aviso-aplicacion";
            aviso.className = "aviso-aplicacion";
            aviso.setAttribute("role", "status");
            document.body.append(aviso);
        }
        aviso.textContent = mensaje;
        aviso.classList.add("visible");
        window.clearTimeout(avisar.temporizador);
        avisar.temporizador = window.setTimeout(() => aviso.classList.remove("visible"), 3200);
    };

    const cerrarModal = (modal) => {
        modal?.classList.remove("abierto");
        modal?.setAttribute("aria-hidden", "true");
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    };

    const actualizarResumen = (lista, resumen, etiqueta) => {
        if (!lista || !resumen) return;
        const cantidad = lista.querySelectorAll("tr:not(.fila-resumen)").length;
        const celda = resumen.querySelector("td");
        if (celda) celda.textContent = `Mostrando ${cantidad} ${etiqueta}`;
    };

    const configurarMenu = () => {
        const boton = document.querySelector(".boton-menu");
        const sidebar = document.querySelector(".sidebar");
        if (!boton || !sidebar) return;
        boton.type = "button";
        boton.setAttribute("aria-label", "Abrir o cerrar menú");
        boton.setAttribute("aria-expanded", "false");
        boton.addEventListener("click", () => {
            const abierto = sidebar.classList.toggle("sidebar-abierto");
            boton.setAttribute("aria-expanded", String(abierto));
        });
    };

    const configurarFiltroLibros = () => {
        const campo = document.querySelector("#buscar-libro");
        const categoria = document.querySelector("#filtro-categoria");
        const estado = document.querySelector("#filtro-estado");
        if (!campo || !document.querySelector(".fila-libro")) return;
        const filtrar = () => {
            const filas = [...document.querySelectorAll(".fila-libro")];
            const texto = normalizar(campo.value);
            const categoriaElegida = normalizar(categoria?.value || "todas");
            const estadoElegido = normalizar(estado?.value || "todos");
            let visibles = 0;
            filas.forEach((fila) => {
                const contenido = normalizar(`${fila.dataset.titulo} ${fila.dataset.autor} ${fila.dataset.isbn || ""}`);
                const coincide = contenido.includes(texto)
                    && (categoriaElegida === "todas" || normalizar(fila.dataset.categoria) === categoriaElegida)
                    && (estadoElegido === "todos" || normalizar(fila.dataset.estado) === estadoElegido);
                fila.hidden = !coincide;
                if (coincide) visibles += 1;
            });
            const aviso = document.querySelector("#sin-resultados");
            if (aviso) aviso.hidden = visibles > 0;
        };
        campo.closest(".filtros")?.querySelector(".btn-buscar")?.addEventListener("click", filtrar);
        campo.addEventListener("keydown", (evento) => evento.key === "Enter" && filtrar());
        categoria?.addEventListener("change", filtrar);
        estado?.addEventListener("change", filtrar);
    };

    const configurarBuscadoresGenericos = () => {
        document.querySelectorAll("[data-filtro-tabla]").forEach((contenedor) => {
            const campo = contenedor.querySelector("input");
            const boton = contenedor.querySelector(".btn-buscar");
            const tabla = document.querySelector(contenedor.dataset.filtroTabla);
            if (!campo || !boton || !tabla) return;
            const filtrar = () => {
                const termino = normalizar(campo.value);
                const filas = [...tabla.querySelectorAll("tbody tr:not(.fila-resumen)")];
                filas.forEach((fila) => fila.hidden = !normalizar(fila.textContent).includes(termino));
            };
            boton.type = "button";
            boton.addEventListener("click", filtrar);
            campo.addEventListener("keydown", (evento) => evento.key === "Enter" && filtrar());
        });

        const buscadorCatalogo = document.querySelector("#buscar-catalogo");
        const tarjetas = [...document.querySelectorAll(".catalogo-card")];
        if (buscadorCatalogo && tarjetas.length) {
            const filtrarCatalogo = () => {
                const termino = normalizar(buscadorCatalogo.value);
                tarjetas.forEach((tarjeta) => tarjeta.hidden = !normalizar(tarjeta.textContent).includes(termino));
            };
            document.querySelector("#buscar-catalogo-boton")?.addEventListener("click", filtrarCatalogo);
            buscadorCatalogo.addEventListener("keydown", (evento) => evento.key === "Enter" && filtrarCatalogo());
        }
    };

    const configurarDetalles = () => {
        document.addEventListener("click", (evento) => {
            const boton = evento.target.closest(".btn-ver");
            if (!boton) return;
            const fila = boton.closest("tr");
            if (!fila) return;

            if (fila.dataset.titulo && document.querySelector("#detalle-libro")) {
                const libro = fila.dataset;
                document.querySelector("#detalle-titulo").textContent = libro.titulo;
                ["autor", "isbn", "categoria", "estado", "ubicacion"].forEach((campo) => {
                    document.querySelector(`#detalle-${campo}`).textContent = libro[campo] || "No registrado";
                });
                document.querySelector("#detalle-libro").showModal();
                return;
            }

            if (fila.dataset.nombre && document.querySelector("#detalle-usuario")) {
                const usuario = fila.dataset;
                document.querySelector("#usuario-detalle-nombre").textContent = usuario.nombre;
                ["id", "correo", "telefono", "tipo", "estado"].forEach((campo) => {
                    document.querySelector(`#usuario-detalle-${campo}`).textContent = usuario[campo] || "No registrado";
                });
                document.querySelector("#detalle-usuario").showModal();
            }
        });

        document.querySelectorAll("dialog").forEach((dialogo) => {
            dialogo.querySelector(".detalle-cerrar")?.addEventListener("click", () => dialogo.close());
            dialogo.addEventListener("click", (evento) => evento.target === dialogo && dialogo.close());
        });
    };

    const crearFilaUsuario = (usuario) => {
        const fila = document.createElement("tr");
        Object.assign(fila.dataset, usuario);
        const clase = normalizar(usuario.estado).includes("multa") ? "deudor-tag" : "activo-tag";
        fila.innerHTML = `<td><strong>${escapar(usuario.id)}</strong></td><td>${escapar(usuario.nombre)}</td><td>${escapar(usuario.correo)}</td><td>${escapar(usuario.tipo)}</td><td><span class="estado ${clase}">${escapar(usuario.estado)}</span></td><td><button class="btn-ver" type="button">Ver</button></td>`;
        return fila;
    };

    const configurarUsuarios = () => {
        const lista = document.querySelector("#usuarios-lista");
        const formulario = document.querySelector("#form-usuario");
        if (!lista || !formulario) return;
        leerDatos(CLAVES.usuarios).forEach((usuario) => lista.insertBefore(crearFilaUsuario(usuario), document.querySelector("#usuarios-resumen")));
        actualizarResumen(lista, document.querySelector("#usuarios-resumen"), "usuarios registrados");

        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();
            if (!formulario.reportValidity()) return;
            const datos = Object.fromEntries(new FormData(formulario));
            const numeros = [...lista.querySelectorAll("tr[data-id]")].map((fila) => Number(fila.dataset.id.replace(/\D/g, "")) || 0);
            const usuario = {
                id: `USR-${String(Math.max(0, ...numeros) + 1).padStart(3, "0")}`,
                nombre: [datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido].filter(Boolean).join(" "),
                correo: datos.correo, telefono: datos.telefono, tipo: datos.tipo, estado: "Activo"
            };
            lista.insertBefore(crearFilaUsuario(usuario), document.querySelector("#usuarios-resumen"));
            actualizarResumen(lista, document.querySelector("#usuarios-resumen"), "usuarios registrados");
            const guardados = leerDatos(CLAVES.usuarios); guardados.push(usuario); guardarDatos(CLAVES.usuarios, guardados);
            formulario.reset(); cerrarModal(document.querySelector("#modal-usuario"));
            avisar(`Usuario ${usuario.id} registrado correctamente.`);
        });
    };

    const crearFilaLibro = (libro) => {
        const fila = document.createElement("tr");
        fila.className = "fila-libro";
        Object.assign(fila.dataset, libro);
        const estadoClase = normalizar(libro.estado) === "disponible" ? "disponible" : "prestado";
        fila.innerHTML = `<td><div class="portada portada-3">📘</div></td><td><strong>${escapar(libro.titulo)}</strong></td><td>${escapar(libro.autor)}</td><td>${escapar(libro.categoria)}</td><td><span class="estado ${estadoClase}">● ${escapar(libro.estado)}</span></td><td>${escapar(libro.ubicacion)}</td><td><button class="btn-ver" type="button">Ver</button></td>`;
        return fila;
    };

    const configurarLibros = () => {
        const lista = document.querySelector("#libros-lista");
        const formulario = document.querySelector("#form-libro");
        if (!lista || !formulario) return;
        leerDatos(CLAVES.libros).forEach((libro) => lista.insertBefore(crearFilaLibro(libro), document.querySelector("#libros-resumen")));
        actualizarResumen(lista, document.querySelector("#libros-resumen"), "ejemplares en inventario");
        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();
            if (!formulario.reportValidity()) return;
            const libro = Object.fromEntries(new FormData(formulario));
            lista.insertBefore(crearFilaLibro(libro), document.querySelector("#libros-resumen"));
            actualizarResumen(lista, document.querySelector("#libros-resumen"), "ejemplares en inventario");
            const guardados = leerDatos(CLAVES.libros); guardados.push(libro); guardarDatos(CLAVES.libros, guardados);
            formulario.reset(); cerrarModal(document.querySelector("#modal-libro"));
            avisar(`“${libro.titulo}” se añadió al inventario.`);
        });
    };

    const formatoFecha = (fecha) => fecha ? fecha.split("-").reverse().join("/") : "";
    const crearFilaPrestamo = (prestamo) => {
        const fila = document.createElement("tr"); fila.dataset.id = prestamo.id;
        fila.innerHTML = `<td><strong>${escapar(prestamo.id)}</strong></td><td>${escapar(prestamo.codigoLibro)}</td><td>${escapar(prestamo.tituloLibro)}</td><td>${escapar(prestamo.idUsuario)}</td><td>${escapar(prestamo.miembro)}</td><td>${escapar(formatoFecha(prestamo.fechaPrestamo))}</td><td>${escapar(formatoFecha(prestamo.fechaVencimiento))}</td><td><span class="etiqueta-estado etiqueta-alerta">Prestado</span></td>`;
        return fila;
    };

    const configurarPrestamos = () => {
        const lista = document.querySelector("#prestamos-lista"); const formulario = document.querySelector("#form-prestamo");
        if (!lista || !formulario) return;
        leerDatos(CLAVES.prestamos).forEach((item) => lista.insertBefore(crearFilaPrestamo(item), document.querySelector("#prestamos-resumen")));
        actualizarResumen(lista, document.querySelector("#prestamos-resumen"), "préstamos registrados");
        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault(); if (!formulario.reportValidity()) return;
            const prestamo = Object.fromEntries(new FormData(formulario));
            const numeros = [...lista.querySelectorAll("tr[data-id]")].map((fila) => Number(fila.dataset.id.replace(/\D/g, "")) || 0);
            prestamo.id = `PRST-${Math.max(900, ...numeros) + 1}`;
            lista.insertBefore(crearFilaPrestamo(prestamo), document.querySelector("#prestamos-resumen"));
            actualizarResumen(lista, document.querySelector("#prestamos-resumen"), "préstamos registrados");
            const guardados = leerDatos(CLAVES.prestamos); guardados.push(prestamo); guardarDatos(CLAVES.prestamos, guardados);
            formulario.reset(); cerrarModal(document.querySelector("#modal-prestamo")); avisar(`Préstamo ${prestamo.id} registrado.`);
        });
    };

    const configurarAcciones = () => {
        document.querySelectorAll("[data-destino]").forEach((control) => control.addEventListener("click", () => window.location.href = control.dataset.destino));
        document.querySelectorAll("[data-abrir-modal]").forEach((control) => control.addEventListener("click", () => {
            const modal = document.querySelector(`#${control.dataset.abrirModal}`);
            modal?.classList.add("abierto"); modal?.setAttribute("aria-hidden", "false");
        }));
        document.querySelectorAll("[data-cerrar-modal]").forEach((control) => control.addEventListener("click", () => cerrarModal(control.closest(".modal-overlay"))));
        document.querySelectorAll(".modal-overlay").forEach((modal) => modal.addEventListener("click", (evento) => {
            if (evento.target === modal) cerrarModal(modal);
        }));

        const listaDevoluciones = document.querySelector("#devoluciones-lista");
        leerDatos(CLAVES.devoluciones).forEach((devolucion) => {
            if (!listaDevoluciones) return;
            const fila = document.createElement("tr"); fila.dataset.id = devolucion.id;
            fila.innerHTML = `<td><strong>${escapar(devolucion.id)}</strong></td><td>${escapar(devolucion.codigo)}</td><td>${escapar(devolucion.titulo)}</td><td>${escapar(devolucion.miembro)}</td><td>${escapar(devolucion.fecha)}</td><td><span class="texto-exito">Excelente</span></td>`;
            listaDevoluciones.append(fila);
        });

        const botonDevolucion = document.querySelector("#procesar-devolucion");
        botonDevolucion?.addEventListener("click", () => {
            const campo = document.querySelector("#codigo-devolucion");
            const codigo = campo?.value.trim().toUpperCase();
            if (!codigo) { campo?.focus(); avisar("Ingrese el código del libro que desea devolver."); return; }
            const lista = document.querySelector("#devoluciones-lista");
            const numeros = [...lista.querySelectorAll("tr[data-id]")].map((fila) => Number(fila.dataset.id.replace(/\D/g, "")) || 0);
            const titulos = { "LIB-4022": "Cien años de soledad", "LIB-1057": "Cálculo Integral Vol. 1", "LIB-8841": "Don Quijote de la Mancha" };
            const devolucion = { id: `RET-${Math.max(400, ...numeros) + 1}`, codigo, titulo: titulos[codigo] || "Ejemplar registrado", miembro: "Usuario de biblioteca", fecha: new Date().toLocaleDateString("es-CO") };
            const fila = document.createElement("tr"); fila.dataset.id = devolucion.id;
            fila.innerHTML = `<td><strong>${escapar(devolucion.id)}</strong></td><td>${escapar(codigo)}</td><td>${escapar(devolucion.titulo)}</td><td>${escapar(devolucion.miembro)}</td><td>${escapar(devolucion.fecha)}</td><td><span class="texto-exito">Excelente</span></td>`;
            lista.append(fila); const guardados = leerDatos(CLAVES.devoluciones); guardados.push(devolucion); guardarDatos(CLAVES.devoluciones, guardados);
            campo.value = ""; avisar(`Devolución ${devolucion.id} procesada correctamente.`);
        });
    };

    const iniciar = () => {
        configurarMenu();
        configurarFiltroLibros();
        configurarBuscadoresGenericos();
        configurarDetalles();
        configurarUsuarios();
        configurarLibros();
        configurarPrestamos();
        configurarAcciones();
    };
    return { iniciar };
})();

document.addEventListener("DOMContentLoaded", BibliotecaApp.iniciar);
