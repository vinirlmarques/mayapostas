import { db } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { nomeArquivo, dados } = req.body;

    if (!nomeArquivo || !dados) {
      return res.status(400).json({ mensagem: "Nome do arquivo ou dados ausentes." });
    }

    try {
      const documentoRef = doc(db, "jogos", nomeArquivo); // Usando nomeArquivo como ID do documento
      await setDoc(documentoRef, dados); // Salva com o ID específico

      res.status(200).json({ mensagem: "Arquivo salvo com sucesso no Firestore!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao salvar o arquivo." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ mensagem: `Método ${req.method} não permitido.` });
  }
}
