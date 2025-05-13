import { db } from "@/firebaseConfig"; 
import { collection, getDocs } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const colecaoJogos = collection(db, "jogos");
      const snapshot = await getDocs(colecaoJogos);
      const jogos: Record<string, any>[] = [];

      snapshot.forEach((doc) => {
        const dados = doc.data();
        jogos.push({ id: doc.id, ...dados });
      });

      // Ordenar os jogos por data (document.time1.dia)
      jogos.sort((a, b) => {
        const dataA = new Date(a.time1.dia.split("/").reverse().join("-")); 
        const dataB = new Date(b.time1.dia.split("/").reverse().join("-"));
        return dataB.getTime() - dataA.getTime(); // Ordem decrescente
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