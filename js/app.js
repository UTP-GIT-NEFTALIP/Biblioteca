"use strict";

const BibliotecaApp = (() => {
    const normalizar = (texto = "") => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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
        const filas = [...document.querySelectorAll(".fila-libro")];
        if (!campo || !filas.length) return;
        const filtrar = () => {
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
            const filas = [...tabla.querySelectorAll("tbody tr:not(.fila-resumen)")];
            const filtrar = () => {
                const termino = normalizar(campo.value);
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
        const dialogo = document.querySelector("#detalle-libro");
        document.querySelectorAll(".btn-ver").forEach((boton) => {
            boton.type = "button";
            boton.addEventListener("click", () => {
                const fila = boton.closest("tr");
                if (dialogo && fila?.dataset.titulo) {
                    const libro = fila.dataset;
                    document.querySelector("#detalle-titulo").textContent = libro.titulo;
                    ["autor", "isbn", "categoria", "estado", "ubicacion"].forEach((campo) => {
                        document.querySelector(`#detalle-${campo}`).textContent = libro[campo] || "No registrado";
                    });
                    dialogo.showModal();
                } else {
                    window.alert(fila ? fila.innerText.replace(/\s+/g, " ").trim() : "Detalle no disponible");
                }
            });
        });
        dialogo?.querySelector(".detalle-cerrar")?.addEventListener("click", () => dialogo.close());
        dialogo?.addEventListener("click", (evento) => evento.target === dialogo && dialogo.close());
    };

    const configurarAcciones = () => {
        document.querySelectorAll("[data-destino]").forEach((control) => control.addEventListener("click", () => window.location.href = control.dataset.destino));
        document.querySelectorAll("[data-mensaje]").forEach((control) => control.addEventListener("click", () => window.alert(control.dataset.mensaje)));
        document.querySelector("#procesar-devolucion")?.addEventListener("click", () => {
            const codigo = document.querySelector("#codigo-devolucion")?.value.trim();
            window.alert(codigo ? `Entrada ${codigo} procesada correctamente (demostración).` : "Ingrese el código del libro que desea devolver.");
        });
    };

    const iniciar = () => {
        configurarMenu();
        configurarFiltroLibros();
        configurarBuscadoresGenericos();
        configurarDetalles();
        configurarAcciones();
    };
    return { iniciar };
})();

document.addEventListener("DOMContentLoaded", BibliotecaApp.iniciar);
