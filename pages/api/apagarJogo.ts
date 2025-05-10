import { db } from "@/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    const { id } = req.query; // O ID do jogo a ser deletado deve ser passado como parâmetro na URL.

    if (!id) {
      return res.status(400).json({ mensagem: "ID do jogo ausente." });
    }

    try {
      const jogoRef = doc(db, "jogos", id as string); // Referência ao jogo na coleção "jogos"
      await deleteDoc(jogoRef); // Deleta o documento do jogo

      res.status(200).json({ mensagem: "Jogo apagado com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao apagar o jogo." });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).json({ mensagem: `Método ${req.method} não permitido.` });
  }
}
