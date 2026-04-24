const API = "https://controle-de-livros-backend.onrender.com";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login/login.html";
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login/login.html";
}

function limparBusca() {
    document.getElementById("LivroId").value = "";

    document.getElementById("lista").innerHTML = "";
}

function limparBuscaporId() {
    document.getElementById("LivroId").value = "";

    document.getElementById("lista-id").innerHTML = "";
}

function limparBuscaporTitulo() {
    document.getElementById("LivroTitulo").value = "";

    document.getElementById("lista-titulo").innerHTML = "";
}

async function buscarLivros() {
    const resposta = await fetch(`${API}/livros`);
    const livros = await resposta.json();

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    livros.forEach(livro => {
        const li = document.createElement("li");
        li.classList.add("livro-card");

        const id = document.createElement("span");
        id.textContent = livro.id + " - ";

        const titulo = document.createElement("span");
        titulo.textContent = livro.titulo;
        titulo.classList.add("livro-titulo");

        titulo.addEventListener("click", () => {
        abrirLivro(livro.id);
        });

        li.appendChild(id);
        li.appendChild(titulo);

        lista.appendChild(li);
    });
}

document.getElementById("LivroId")
.addEventListener("input", buscarLivrosPorId);

document.getElementById("LivroId")
.addEventListener("input", buscarLivrosPorId);

async function buscarLivrosPorId() {
    const id = document.getElementById("LivroId").value;
    const lista = document.getElementById("lista-id");

    if (!id || isNaN(id)) {
        limparBuscaporId();
        return;
    }

    try {
        const resposta = await fetch(`${API}/livros/id/${id}`);

        if (!resposta.ok) {
            lista.innerHTML = `
                <li class="livro-card-id">
                    <p>Livro não encontrado</p>
                </li>
            `;
            return;
        }

        const livro = await resposta.json();

        lista.innerHTML = `
            <li class="livro-card-id">
                <p>id: ${livro.id}</p>
                <p class="livro-link" onclick="abrirLivro(${livro.id})">${livro.titulo}</p>
                <p>autor: ${livro.autor}</p>
            </li>
        `;

    } catch (err) {
        console.error("Erro ao buscar livro por ID:", err);
    }
}

document.getElementById("LivroTitulo")
.addEventListener("input", buscarLivrosPorTitulo);


async function buscarLivrosPorTitulo() {
    const tituloInput = document.getElementById("LivroTitulo").value;
    const lista = document.getElementById("lista-titulo");

    if (!tituloInput) {
        limparBuscaporTitulo();
        return;
    }

    const resposta = await fetch(`${API}/livros/titulo/${encodeURIComponent(tituloInput)}`);
    const livros = await resposta.json();

    lista.innerHTML = "";

    if (!livros.length) {
        lista.innerHTML = `
            <li class="livro-card-id">
                <p>Livro não encontrado</p>
            </li>
        `;
        return;
    }

    livros.forEach(livro => {
        const li = document.createElement("li");
        li.classList.add("livro-card-id");


        const titulo = document.createElement("span");
        titulo.textContent = livro.titulo;
        titulo.classList.add("livro-titulo");

        const autor = document.createElement("p");
        autor.textContent = "autor: " + livro.autor;

        titulo.addEventListener("click", () => {
            abrirLivro(livro.id);
        });

        li.appendChild(titulo);
        li.appendChild(autor);

        lista.appendChild(li);
    });
}

 async function criarLivro() {
    const titulo = document.getElementById("titulo").value;
    const autor = document.getElementById("autor").value;

    if (!titulo || !autor) {
    alert("Preencha todos os campos");
    return;
    }

    const resposta = await fetch(`${API}/livros`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titulo: titulo,
            autor: autor
        })
    });
    
    const dados = await resposta.json();

    if(resposta.ok) {
        alert("Livro adicionado");
        document.querySelector("titulo").value = "";
        document.querySelector("autor").value = "";
    } else {
        alert(dados.erro);
    }
 }

document.getElementById("LivroId")
.addEventListener("input", buscarLivrosPorId);

async function alterarLivro() {
    const id = document.getElementById("LivroId").value;
    const titulo = document.getElementById("alterarTitulo").value;
    const autor = document.getElementById("alterarAutor").value;

    if (!id || !titulo || !autor) {
        alert("Preencha todos os campos");
        return;
    }

    const resposta = await fetch(`${API}/livros/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titulo,
            autor
        })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
        alert("Livro atualizado!");
    } else {
        alert(dados.erro);
    }
}

async function removerLivro() {

    const id = document.getElementById("LivroIdRemover").value;

    if (!id) {
        alert("Informe o Id");
        return;
    }

    const resposta = await fetch(`${API}/livros/${id}`, {
        method: "DELETE"
    });

    const dados = await resposta.json();

    if (resposta.ok) {
        alert("Livro deletado!");
    } else {
        alert(dados.erro);
    }
}

let livroAtualId = null;

async function abrirLivro(id) {
    livroAtualId = id;

    const sidebar = document.getElementById("livro-sidebar");
    const overlay = document.getElementById("livro-overlay");
    const livroContent = document.querySelector(".livro-content");
    const capa = document.getElementById("sidebar-capa");
    const containerCapa = document.querySelector(".capa-container");

    if (!sidebar || !overlay) return;

    const token = localStorage.getItem("token");

    const resposta = await fetch(`${API}/livros/id/${id}`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!resposta.ok) return;

    const livro = await resposta.json();

    document.getElementById("sidebar-titulo").textContent = livro.titulo;
    document.getElementById("sidebar-autor").textContent = "Autor: " + livro.autor;
    document.getElementById("sidebar-id").textContent = "ID: " + livro.id;
    document.getElementById("sidebar-resumo").value = livro.resumo || "";

    // Reset padrão: esconde os botões sempre que abrir um novo livro
    livroContent.classList.remove("show-actions");

    if (livro.capa_url) {
        // --- ESTADO: COM IMAGEM ---
        capa.src = API + livro.capa_url;
        capa.style.display = "block";
        containerCapa.classList.remove("vazia");
        
        // Remove o clique: se já tem capa, clicar não faz nada
        containerCapa.onclick = null;
        containerCapa.style.cursor = "default";
    } else {
        // --- ESTADO: SEM IMAGEM ---
        capa.src = "";
        capa.style.display = "none";
        containerCapa.classList.add("vazia");

        // ATENÇÃO AQUI: Adicionamos o clique para mostrar os botões
        containerCapa.style.cursor = "pointer";
        containerCapa.onclick = function() {
            livroContent.classList.toggle("show-actions");
        };
    }

    sidebar.classList.add("active");
    overlay.classList.add("active");
}

async function salvarResumo() {
    const resumo = document.getElementById("sidebar-resumo").value;
    if (!livroAtualId) return; 

    const token = localStorage.getItem("token");

    const resposta = await fetch(`${API}/livros/${livroAtualId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ resumo })
    });

    if (resposta.ok) {
        alert("Resumo salvo!");
    } else {
        alert("Erro ao salvar resumo.");
    }
}

function closeLivro() {
    const sidebar = document.getElementById("livro-sidebar");
    const overlay = document.getElementById("livro-overlay");
    const livroContent = document.querySelector(".livro-content");

    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    
    if (livroContent) {
        livroContent.classList.remove("show-actions");
    }
}

async function enviarCapa() {
    if (!livroAtualId) return alert("Nenhum livro selecionado");

    const inputCapaFile = document.getElementById("input-capa-file");
    
    if (!inputCapaFile || !inputCapaFile.files[0]) return alert("Escolha um arquivo");

    const formData = new FormData();
    formData.append("capa", inputCapaFile.files[0]);

    try {
        const url = `${API}/livros/${livroAtualId}/upload_capa`;
        const token = localStorage.getItem("token");

        const res = await fetch(url, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        if (!res.ok) throw new Error("Erro no upload");

        const data = await res.json();

        if (data.capa_url) {
            const capa = document.getElementById("sidebar-capa");
            const livroContent = document.querySelector(".livro-content");

            capa.src = API + data.capa_url + "?t=" + new Date().getTime();

            livroContent.classList.remove("show-actions");
            capa.onclick = null;
            capa.style.cursor = "default";

            alert("Capa adicionada com sucesso!");
        }
    } catch (err) {
        alert("Erro ao enviar capa: " + err.message);
    }
}

document.getElementById("btn-salvar-resumo").addEventListener("click", salvarResumo);
document.getElementById("livro-overlay").addEventListener("click", closeLivro);

document.getElementById("escolher-capa").addEventListener("click", () => {
    document.getElementById("input-capa-file").click();
});

document.getElementById("btn-upload-capa").addEventListener("click", enviarCapa);
