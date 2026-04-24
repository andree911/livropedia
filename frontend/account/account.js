const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

async function saveName() {
    const nome = document.getElementById("name").value; 

    if (!nome.trim()) {
        alert("Digite um nome válido");
        return;
    }

    const response = await fetch("https://controle-de-livros-backend-1.onrender.com/me", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ nome })
    });
    
    const data = await response.json();

    if (response.ok) {
        alert("Nome salvo");
    } else {
        alert(data.erro || "Erro ao salvar nome");
    }
}

async function loadUser() {
    const response = await fetch("https://controle-de-livros-backend-1.onrender.com/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await response.json();

    const input = document.getElementById("name");
    const button = document.getElementById("add-name-button");

    if (data.nome) {
        input.value = data.nome;
        input.disabled = true;
        button.style.display = "none";
    }
}

function showConfirm() {
    const div = document.getElementById("confirm-delete-account");
    div.style.display = "block";
}

document.getElementById("delete-account-button-confirm").addEventListener("click", deleteAccount);

async function deleteAccount() {
    
    const senha = document.getElementById("delete-confirm-password").value;
    const token = localStorage.getItem("token");

    if (!senha) {
        alert("Digite sua senha");
        return;
    }

    const confirmar = confirm(
        "Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita"
    );

    if (!confirmar) return;

    try {
        console.log("TOKEN:", token);
        console.log("HEADER:", `Bearer ${token}`);
        const resposta = await fetch("https://controle-de-livros-backend-1.onrender.com/users/me", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {

            alert("Conta excluída com sucesso.");

            localStorage.removeItem("token");

            window.location.href = "../login/login.html";

        } else {
            alert(dados.erro || "Erro ao excluir conta");
        }

    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão com servidor");
    }
}

loadUser();