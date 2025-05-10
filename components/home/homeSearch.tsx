'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Snackbar, Alert } from '@mui/material';


interface Cartao {
    tipo: string;
    minuto: number;
    jogador: string;
}

interface GolAssistencia {
    jogador: string;
    minuto: number;
}

interface DadosTime {
    nome: string;
    finalizacoes: string[];
    contagemFinalizacoes: number[];
    chutesAoGol: string[];
    contagemChutesAoGol: number[];
    assistencias: GolAssistencia[];
    gols: GolAssistencia[];
    faltas: string[];
    contagemFaltas: number[];
    desarmes: string[];
    contagemDesarmes: number[];
    cartoes: Cartao[];
    impedimentos: number[];
    escanteios: { primeiroTempo: number; segundoTempo: number };
}

interface DadosPlanilha {
    time1: DadosTime;
    time2: DadosTime;
}

export default function RegistrarPlanilha() {
    const [dadosJson, setDadosJson] = useState<Record<string, DadosPlanilha> | null>(null);
    const [alerta, setAlerta] = useState<{ mensagem: string, tipo: 'success' | 'error' } | null>(null);
    const inputArquivoRef = useRef<HTMLInputElement>(null);
    const [termoPesquisa, setTermoPesquisa] = useState<string>('');
    const [jogosFiltrados, setJogosFiltrados] = useState<Record<string, DadosPlanilha> | null>(null);

    const filtrarJogos = (termo: string) => {
        if (!dadosJson) return;

        const termoLower = termo.toLowerCase();
        console.log('Termo de pesquisa:', termoLower);
        console.log('Dados JSON:', dadosJson);

        const jogosFiltrados = Object.entries(dadosJson).filter(([nomePlanilha, dadosAba]) => {
            return (
                dadosAba.time1.nome.toLowerCase().includes(termoLower) ||
                dadosAba.time2.nome.toLowerCase().includes(termoLower)
            );
        });

        console.log('Jogos filtrados:', jogosFiltrados);

        setJogosFiltrados(Object.fromEntries(jogosFiltrados));
    };
    const salvarJsonNoServidor = async (nomeArquivo: string, dados: DadosPlanilha) => {
        try {
            const resposta = await fetch('/api/salvarJson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nomeArquivo, dados }),
            });

            if (resposta.ok) {
                const resultado = await resposta.json();
                setAlerta({ mensagem: resultado.mensagem || 'Arquivo salvo com sucesso!', tipo: 'success' });
            } else {
                const erro = await resposta.json();
                setAlerta({ mensagem: erro.mensagem || 'Erro ao salvar o arquivo.', tipo: 'error' });
            }
        } catch (error) {
            console.error(error);
            setAlerta({ mensagem: 'Erro ao conectar com o servidor.', tipo: 'error' });
        }
    };


    useEffect(() => {
        const carregarJogos = async () => {
            try {
                const resposta = await fetch('/api/listarJogos');
                if (resposta.ok) {
                    const jogos = await resposta.json();
                    console.log(jogos);
                    setDadosJson(jogos); // Agora os nomes dos arquivos serão as chaves
                } else {
                    console.error('Erro ao carregar os jogos.');
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor.', error);
            }
        };

        carregarJogos();
    }, []);

    const manipularUploadArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const arquivo = event.target.files ? event.target.files[0] : null;
        if (!arquivo) {
            setAlerta({ mensagem: 'Nenhum arquivo selecionado.', tipo: 'error' });
            return;
        }

        const leitor = new FileReader();
        leitor.onload = (e) => {
            try {
                const dados = new Uint8Array(e.target?.result as ArrayBuffer);
                const planilha = XLSX.read(dados, { type: 'array' });

                const dadosParseados: Record<string, DadosPlanilha> = {};

                planilha.SheetNames.forEach((nomePlanilha: string) => {
                    const aba = XLSX.utils.sheet_to_json(planilha.Sheets[nomePlanilha], { header: 1 }) as any[][];
                    if (aba.length > 0) {
                        const parsearDadosTime = (colunaInicio: number): DadosTime => {
                            return {
                                nome: aba[0][colunaInicio],
                                finalizacoes: aba.slice(1)
                                    .filter(linha => linha[colunaInicio + 1])
                                    .map(linha => linha[colunaInicio + 1]),
                                contagemFinalizacoes: aba.slice(1).map(linha => linha[colunaInicio + 2] || 0).filter(chute => chute !== 0),
                                chutesAoGol: aba.slice(1)
                                    .filter(linha => linha[colunaInicio + 5])
                                    .map(linha => linha[colunaInicio + 5]),
                                contagemChutesAoGol: aba.slice(1).map(linha => linha[colunaInicio + 6] || 0).filter(chute => chute !== 0),
                                assistencias: aba.slice(1)
                                    .map((linha) => {
                                        const jogador = linha[colunaInicio + 3];
                                        const minuto = linha[colunaInicio + 4];
                                        return (jogador && jogador.trim() !== '' && minuto) ? { jogador, minuto } : null;
                                    })
                                    .filter(assistencia => assistencia !== null) as GolAssistencia[],
                                gols: aba.slice(1)
                                    .map((linha) => {
                                        const golInfo = linha[colunaInicio + 4];
                                        if (golInfo) {
                                            const [jogador, minuto] = golInfo.split(' - ');
                                            return jogador && minuto ? { jogador, minuto: parseInt(minuto.trim()) } : null;
                                        }
                                        return null;
                                    })
                                    .filter(gol => gol !== null) as GolAssistencia[],
                                faltas: aba.slice(1)
                                    .map(linha => linha[colunaInicio + 7] || '')
                                    .filter(falta => falta.trim() !== ''),
                                contagemFaltas: aba.slice(1).map(linha => linha[colunaInicio + 8] || 0).filter(falta => falta !== 0),
                                desarmes: aba.slice(1)
                                    .map(linha => linha[colunaInicio + 9] || '')
                                    .filter(desarme => desarme.trim() !== ''),
                                contagemDesarmes: aba.slice(1).map(linha => linha[colunaInicio + 10] || 0).filter(desarme => desarme !== 0),
                                cartoes: aba.slice(1)
                                    .map((linha) => {
                                        const cartaoInfo = linha[colunaInicio + 11];
                                        if (cartaoInfo) {
                                            const [jogador, minuto, tipo] = cartaoInfo.split(' - ');
                                            if (jogador && minuto && tipo) {
                                                return {
                                                    jogador: jogador.trim(),
                                                    minuto: parseInt(minuto.trim()),
                                                    tipo: tipo.trim().toUpperCase() === 'V' ? 'Vermelho' : 'Amarelo'
                                                };
                                            }
                                        }
                                        return null;
                                    })
                                    .filter(cartao => cartao !== null) as Cartao[],
                                impedimentos: [aba[1]?.[colunaInicio + 12] || 0],
                                escanteios: { primeiroTempo: aba[1]?.[colunaInicio + 14] || 0, segundoTempo: aba[2]?.[colunaInicio + 14] || 0 }
                            };
                        };

                        const dadosAba: DadosPlanilha = {
                            time1: parsearDadosTime(0),
                            time2: parsearDadosTime(15)
                        };

                        dadosParseados[nomePlanilha] = dadosAba;

                        // Salvar o jogo no servidor
                        salvarJsonNoServidor(nomePlanilha, dadosAba);
                    }
                });

                console.log(dadosParseados);
                setDadosJson(dadosParseados);
                setAlerta({ mensagem: 'Planilha carregada com sucesso!', tipo: 'success' });
            } catch (error) {
                console.error(error);
                setAlerta({ mensagem: 'Erro ao processar a planilha.', tipo: 'error' });
            }
        };

        leitor.readAsArrayBuffer(arquivo);
    };

    const fecharAlerta = () => setAlerta(null);

    const dispararInputArquivo = () => {
        if (inputArquivoRef.current) inputArquivoRef.current.click();
    };



    return (
        <div className="p-4 w-full">
            {/* Campo de pesquisa */}
            <input
                type="text"
                placeholder="Pesquisar time"
                value={termoPesquisa}
                onChange={(e) => {
                    const termo = e.target.value;
                    setTermoPesquisa(termo);
                    filtrarJogos(termo);
                }}
                className="p-2 border rounded w-full mb-4"
            />

            {/* Botão para subir planilha */}
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={manipularUploadArquivo}
                ref={inputArquivoRef}
                className="hidden"
            />
            <button
                onClick={() => inputArquivoRef.current?.click()}
                className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
                Subir Planilha de Jogos
            </button>

            {/* Alerta */}
            <Snackbar
                open={!!alerta}
                autoHideDuration={4000}
                onClose={fecharAlerta}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {alerta ? (
                    <Alert onClose={fecharAlerta} severity={alerta.tipo}>
                        {alerta.mensagem}
                    </Alert>
                ) : undefined}
            </Snackbar>

            {/* Exibição dos jogos */}
            {(jogosFiltrados || dadosJson) && (
                <div className="mt-6">
                    {Object.entries(jogosFiltrados || dadosJson || {}).map(([nomePlanilha, dadosAba]) => {
                        // Extrai a data do nome do arquivo (assumindo que está no formato "DDMM" no final)
                        const match = nomePlanilha.match(/(\d{2})(\d{2})$/);
                        let dataFormatada = '';
                        if (match) {
                            const dia = parseInt(match[1], 10);
                            const mes = parseInt(match[2], 10);
                            const meses = [
                                'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
                            ];
                            dataFormatada = `${dia} de ${meses[mes - 1]}`;
                        }

                        return (
                            <div key={nomePlanilha} className="mb-6">
                                <h2 className="text-xl font-semibold mb-4">
                                    {dadosAba.time1.nome} X {dadosAba.time2.nome}
                                    {dataFormatada && <span className="text-gray-500 text-sm"> - {dataFormatada}</span>}
                                </h2>
                                <div className="flex space-x-4">
                                    {/* Time 1 */}
                                    <div className="p-4 border rounded shadow w-1/2">
                                        <h3 className="font-bold text-3xl mb-12">{dadosAba.time1.nome}</h3>
                                        <ul className="list-none space-y-2">
                                            <strong className="text-green-400">Finalizações:</strong>
                                            {dadosAba.time1.finalizacoes.length > 0 ? (
                                                dadosAba.time1.finalizacoes.map((jogador, index) => (
                                                    <li key={index}>
                                                        {jogador} - {dadosAba.time1.contagemFinalizacoes[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem chutes</li>
                                            )}

                                            <strong className="text-green-400">Chutes ao Gol:</strong>
                                            {dadosAba.time1.chutesAoGol.length > 0 ? (
                                                dadosAba.time1.chutesAoGol.map((jogador, index) => (
                                                    <li key={index}>
                                                        {jogador} - {dadosAba.time1.contagemChutesAoGol[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem chutes</li>
                                            )}

                                            <strong className="text-green-400">Gols:</strong>
                                            {dadosAba.time1.gols.length > 0 ? (
                                                dadosAba.time1.gols.map((gol, index) => (
                                                    <li key={index}>
                                                        {gol.jogador} - Minuto: {gol.minuto}’
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem gols</li>
                                            )}

                                            <strong className="text-green-400">Assistências:</strong>
                                            {dadosAba.time1.assistencias.length > 0 ? (
                                                dadosAba.time1.assistencias.map((assistencia, index) => (
                                                    <li key={index}>{assistencia.jogador}</li>
                                                ))
                                            ) : (
                                                <li>Sem assistências</li>
                                            )}

                                            <strong className="text-green-400">Desarmes:</strong>
                                            {dadosAba.time1.desarmes.length > 0 ? (
                                                dadosAba.time1.desarmes.map((desarme, index) => (
                                                    <li key={index}>
                                                        {desarme} - {dadosAba.time1.contagemDesarmes[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem desarmes</li>
                                            )}

                                            <strong className="text-green-400">Faltas:</strong>
                                            {dadosAba.time1.faltas.length > 0 ? (
                                                dadosAba.time1.faltas.map((falta, index) => (
                                                    <li key={index}>
                                                        {falta} - {dadosAba.time1.contagemFaltas[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem faltas</li>
                                            )}

                                            <strong className="text-green-400">Cartões:</strong>
                                            {dadosAba.time1.cartoes.length > 0 ? (
                                                dadosAba.time1.cartoes.map((cartao, index) => (
                                                    <li
                                                        key={index}
                                                        className={`flex items-center ${cartao.tipo === 'Vermelho'
                                                            ? 'text-red-500'
                                                            : 'text-yellow-500'
                                                            }`}
                                                    >
                                                        {cartao.jogador} - Minuto: {cartao.minuto}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem cartões</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Time 2 */}
                                    <div className="p-4 border rounded shadow w-1/2">
                                        <h3 className="font-bold text-3xl mb-12">{dadosAba.time2.nome}</h3>
                                        <ul className="list-none space-y-2">
                                            <strong className="text-green-400">Finalizações:</strong>
                                            {dadosAba.time2.finalizacoes.length > 0 ? (
                                                dadosAba.time2.finalizacoes.map((jogador, index) => (
                                                    <li key={index}>
                                                        {jogador} - {dadosAba.time2.contagemFinalizacoes[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem chutes</li>
                                            )}

                                            <strong className="text-green-400">Chutes ao Gol:</strong>
                                            {dadosAba.time2.chutesAoGol.length > 0 ? (
                                                dadosAba.time2.chutesAoGol.map((jogador, index) => (
                                                    <li key={index}>
                                                        {jogador} - {dadosAba.time2.contagemChutesAoGol[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem chutes</li>
                                            )}

                                            <strong className="text-green-400">Gols:</strong>
                                            {dadosAba.time2.gols.length > 0 ? (
                                                dadosAba.time2.gols.map((gol, index) => (
                                                    <li key={index}>
                                                        {gol.jogador} - Minuto: {gol.minuto}’
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem gols</li>
                                            )}

                                            <strong className="text-green-400">Assistências:</strong>
                                            {dadosAba.time2.assistencias.length > 0 ? (
                                                dadosAba.time2.assistencias.map((assistencia, index) => (
                                                    <li key={index}>{assistencia.jogador}</li>
                                                ))
                                            ) : (
                                                <li>Sem assistências</li>
                                            )}

                                            <strong className="text-green-400">Desarmes:</strong>
                                            {dadosAba.time2.desarmes.length > 0 ? (
                                                dadosAba.time2.desarmes.map((desarme, index) => (
                                                    <li key={index}>
                                                        {desarme} - {dadosAba.time2.contagemDesarmes[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem desarmes</li>
                                            )}

                                            <strong className="text-green-400">Faltas:</strong>
                                            {dadosAba.time2.faltas.length > 0 ? (
                                                dadosAba.time2.faltas.map((falta, index) => (
                                                    <li key={index}>
                                                        {falta} - {dadosAba.time2.contagemFaltas[index]}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem faltas</li>
                                            )}

                                            <strong className="text-green-400">Cartões:</strong>
                                            {dadosAba.time2.cartoes.length > 0 ? (
                                                dadosAba.time2.cartoes.map((cartao, index) => (
                                                    <li
                                                        key={index}
                                                        className={`flex items-center ${cartao.tipo === 'Vermelho'
                                                            ? 'text-red-500'
                                                            : 'text-yellow-500'
                                                            }`}
                                                    >
                                                        {cartao.jogador} - Minuto: {cartao.minuto}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Sem cartões</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

}
