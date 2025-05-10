import { db } from "@/firebaseConfig"; 
import { collection, getDocs } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const colecaoJogos = collection(db, "jogos");
      const snapshot = await getDocs(colecaoJogos);
      const jogos: Record<string, any> = {};

      snapshot.forEach((doc) => {
        jogos[doc.id] = doc.data();
      });

      res.status(200).json(jogos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao listar os jogos." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ mensagem: `Método ${req.method} não permitido.` });
  }
}
