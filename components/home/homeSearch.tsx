'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Snackbar, Alert, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Importa o ícone de exclusão
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'; // Ícone para gols
import SportsIcon from '@mui/icons-material/Sports'; // Ícone para finalizações
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Ícone para assistências
import ShieldIcon from '@mui/icons-material/Shield'; // Ícone para desarmes
import WarningIcon from '@mui/icons-material/Warning'; // Ícone para faltas
import CardMembershipIcon from '@mui/icons-material/CardMembership'; // Ícone para cartões
import BlockIcon from '@mui/icons-material/Block'; // Ícone para impedimentos
import FlagIcon from '@mui/icons-material/Flag'; 



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
    dia?: string;
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
    impedimentos: number;
    escanteios: { primeiroTempo: number; segundoTempo: number };
}

interface DadosPlanilha {
    time1: DadosTime;
    time2: DadosTime;
    placar?: string;
}

export default function RegistrarPlanilha() {
    const [dadosJson, setDadosJson] = useState<Record<string, DadosPlanilha> | null>(null);
    const [alerta, setAlerta] = useState<{ mensagem: string, tipo: 'success' | 'error' } | null>(null);
    const inputArquivoRef = useRef<HTMLInputElement>(null);
    const [termoPesquisa, setTermoPesquisa] = useState<string>('');
    const [jogosFiltrados, setJogosFiltrados] = useState<Record<string, DadosPlanilha> | null>(null);
    const [abaSelecionadaTime1, setAbaSelecionadaTime1] = useState(0);
    const [abaSelecionadaTime2, setAbaSelecionadaTime2] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false); // Estado para controlar o diálogo
    const [jogoSelecionado, setJogoSelecionado] = useState<string | null>(null); // Jogo a ser apagado


    const filtrarJogos = (termo: string) => {
        if (!dadosJson) return;

        const termoLower = termo.toLowerCase();

        const jogosFiltrados = Object.entries(dadosJson).filter(([nomePlanilha, dadosAba]) => {
            return (
                dadosAba.time1.nome.toLowerCase().includes(termoLower) ||
                dadosAba.time2.nome.toLowerCase().includes(termoLower)
            );
        });


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
            carregarJogos();
            setAlerta({ mensagem: resultado.mensagem || 'Arquivo salvo com sucesso no Firestore!', tipo: 'success' });
        } else {
            const erro = await resposta.json();
            setAlerta({ mensagem: erro.mensagem || 'Erro ao salvar o arquivo no Firestore.', tipo: 'error' });
        }
    } catch (error) {
        console.error(error);
        setAlerta({ mensagem: 'Erro ao conectar com o servidor.', tipo: 'error' });
    }
    };

    const carregarJogos = async () => {
            try {
                const resposta = await fetch('/api/listarJogos');
                if (resposta.ok) {
                    const jogos = await resposta.json();
                    await setDadosJson(jogos);
                    
                } else {
                    console.error('Erro ao carregar os jogos.');
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor.', error);
            }
        };

    useEffect(() => {
        carregarJogos();
    }, []);

     const apagarJogo = async (id: string) => {
        try {
            const resposta = await fetch(`/api/apagarJogo?id=${id}`, {
                method: 'DELETE',
            });

            if (resposta.ok) {
                const resultado = await resposta.json();
                setAlerta({ mensagem: resultado.mensagem || 'Jogo apagado com sucesso!', tipo: 'success' });
                carregarJogos();
            } else {
                const erro = await resposta.json();
                setAlerta({ mensagem: erro.mensagem || 'Erro ao apagar o jogo.', tipo: 'error' });
            }
        } catch (error) {
            console.error(error);
            setAlerta({ mensagem: 'Erro ao conectar com o servidor.', tipo: 'error' });
        }
    };

    const abrirDialogo = (id: string) => {
        setJogoSelecionado(id);
        setDialogOpen(true);
    };

    const fecharDialogo = () => {
        setDialogOpen(false);
        setJogoSelecionado(null);
    };

    const confirmarApagarJogo = () => {
        if (jogoSelecionado) {
            apagarJogo(jogoSelecionado);
        }
        fecharDialogo();
    };

    const handleChangeTabTime1 = (event: React.SyntheticEvent, newValue: number) => {
        setAbaSelecionadaTime1(newValue);
    };

    // Função para alterar a aba do Time 2
    const handleChangeTabTime2 = (event: React.SyntheticEvent, newValue: number) => {
        setAbaSelecionadaTime2(newValue);
    };


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
                        let dia = aba[1]?.[0] || aba[2]?.[0] || null;

                        // Verificar se o dia é um número (formato serial do Excel)
                        if (typeof dia === "number") {
                            const excelBaseDate = new Date(1900, 0, dia - 1); // Ajustando para a base do Excel
                            dia = excelBaseDate.toISOString().split("T")[0].split("-").reverse().join("/");
                        }

                        return {
                            dia: dia,
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
                            impedimentos: aba[1]?.[colunaInicio + 12] || 0,
                            escanteios: { 
                                primeiroTempo: aba[1]?.[colunaInicio + 14] || 0, 
                                segundoTempo: aba[2]?.[colunaInicio + 14] || 0 
                            }
                        };
                    };

                    const time1 = parsearDadosTime(0);
                    const time2 = parsearDadosTime(15);
                    const somaGolsTime1 = time1.gols.length;
                    const somaGolsTime2 = time2.gols.length;

                    const dadosAba: DadosPlanilha = {
                        time1,
                        time2,
                        placar: `${somaGolsTime1} X ${somaGolsTime2}`
                    };

                    dadosParseados[nomePlanilha] = dadosAba;
                    
                    // Salvar o jogo no servidor
                    salvarJsonNoServidor(nomePlanilha, dadosAba);
                }
            });

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
                        if (!dadosAba || !dadosAba.time1 || !dadosAba.time2) {
                            console.error(`Dados do jogo ${nomePlanilha} estão inválidos:`, dadosAba);
                            return null;
                        }

                        return (
                            <div key={nomePlanilha} className="mb-6">
                                <div className="flex justify-start items-start flex-row">
                                    <h2 className="text-xl font-semibold mb-4">
                                    {dadosAba.time1.nome} X {dadosAba.time2.nome} ({dadosAba.placar})
                                    <span className="text-gray-500 text-sm"> {dadosAba.time1.dia}</span>
                                </h2>

                                    <IconButton
                                    onClick={() => abrirDialogo(nomePlanilha)}
                                    color="error"
                                    aria-label="Apagar jogo"
                                >
                                    <DeleteIcon />
                                 </IconButton>
                                </div>

                                {/* Layout Flexbox para organizar as abas e as informações dos times lado a lado */}
                                <div className="flex space-x-10">
                                    {/* Controle de abas e informações do Time 1 */}
                                    <div className="w-1/2">
                                        <Tabs
                                                value={abaSelecionadaTime1}
                                                onChange={handleChangeTabTime1}
                                                indicatorColor="primary"
                                                variant="scrollable"
                                                scrollButtons="auto"
                                                orientation="horizontal"
                                            >
                                                <Tab
                                                    icon={<SportsIcon />}
                                                    title="Finalizações"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<SportsSoccerIcon />}
                                                    title="Chutes ao Gol"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<EmojiEventsIcon />}
                                                    title="Gols"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<EmojiEventsIcon />}
                                                    title="Assistências"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<ShieldIcon />}
                                                    title="Desarmes"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<WarningIcon />}
                                                    title="Faltas"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<CardMembershipIcon />}
                                                    title="Cartões"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<BlockIcon />}
                                                    title="Impedimentos"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                                <Tab
                                                    icon={<FlagIcon />}
                                                    title="Escanteios"
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        '&.Mui-selected': {
                                                            color: 'white',
                                                        },
                                                    }}
                                                />
                                            </Tabs>
                                        {/* Conteúdo das abas para o Time 1 */}
                                        <div className="mt-4 h-[280px] overflow-y-auto">
                                            {abaSelecionadaTime1 === 0 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Finalizações:</strong>
                                                    {dadosAba.time1.finalizacoes.length > 0 ? (
                                                        dadosAba.time1.finalizacoes.map((jogador, index) => (
                                                            <div key={index}>
                                                                {jogador} - {dadosAba.time1.contagemFinalizacoes[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem chutes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 1 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Chutes ao Gol:</strong>
                                                    {dadosAba.time1.chutesAoGol.length > 0 ? (
                                                        dadosAba.time1.chutesAoGol.map((jogador, index) => (
                                                            <div key={index}>
                                                                {jogador} - {dadosAba.time1.contagemChutesAoGol[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem chutes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 2 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Gols:</strong>
                                                    {dadosAba.time1.gols.length > 0 ? (
                                                        dadosAba.time1.gols.map((gol, index) => (
                                                            <div key={index}>
                                                                {gol.jogador} - Minuto: {gol.minuto}’
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem gols</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 3 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Assistências:</strong>
                                                    {dadosAba.time1.assistencias.length > 0 ? (
                                                        dadosAba.time1.assistencias.map((assistencia, index) => (
                                                            <div key={index}>{assistencia.jogador}</div>
                                                        ))
                                                    ) : (
                                                        <div>Sem assistências</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 4 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Desarmes:</strong>
                                                    {dadosAba.time1.desarmes.length > 0 ? (
                                                        dadosAba.time1.desarmes.map((desarme, index) => (
                                                            <div key={index}>
                                                                {desarme} - {dadosAba.time1.contagemDesarmes[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem desarmes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 5 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Faltas:</strong>
                                                    {dadosAba.time1.faltas.length > 0 ? (
                                                        dadosAba.time1.faltas.map((falta, index) => (
                                                            <div key={index}>
                                                                {falta} - {dadosAba.time1.contagemFaltas[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem faltas</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 6 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Cartões:</strong>
                                                    {dadosAba.time1.cartoes.length > 0 ? (
                                                        dadosAba.time1.cartoes.map((cartao, index) => (
                                                            <div
                                                                key={index}
                                                                className={`flex items-center ${cartao.tipo === 'Vermelho' ? 'text-red-500' : 'text-yellow-500'}`}
                                                            >
                                                                {cartao.jogador} - Minuto: {cartao.minuto}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem cartões</div>
                                                    )}
                                                </div>
                                            )}
                                            {abaSelecionadaTime1 === 7 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Impedimentos:</strong>
                                                    {dadosAba.time1.impedimentos > 0 ? (
                                                        <div>{dadosAba.time1.impedimentos} impedimentos</div>
                                                    ) : (
                                                        <div>Sem impedimentos</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime1 === 8 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Escanteios:</strong>
                                                    <div>
                                                        <div>Primeiro Tempo: {dadosAba.time1.escanteios.primeiroTempo}</div>
                                                        <div>Segundo Tempo: {dadosAba.time1.escanteios.segundoTempo}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Controle de abas e informações do Time 2 */}
                                    <div className="w-1/2">
    <Tabs
        value={abaSelecionadaTime2}
        onChange={handleChangeTabTime2}
        indicatorColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        orientation="horizontal"
    >
        <Tab
            icon={<SportsIcon />}
            title="Finalizações"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<SportsSoccerIcon />}
            title="Chutes ao Gol"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<EmojiEventsIcon />}
            title="Gols"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<EmojiEventsIcon />}
            title="Assistências"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<ShieldIcon />}
            title="Desarmes"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<WarningIcon />}
            title="Faltas"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<CardMembershipIcon />}
            title="Cartões"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<BlockIcon />}
            title="Impedimentos"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
        <Tab
            icon={<FlagIcon />}
            title="Escanteios"
            sx={{
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0,
                '&.Mui-selected': {
                    color: 'white',
                },
            }}
        />
    </Tabs>

                                        {/* Conteúdo das abas para o Time 2 */}
                                        <div className="mt-4 h-[280px] overflow-y-auto">
                                            {abaSelecionadaTime2 === 0 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Finalizações:</strong>
                                                    {dadosAba.time2.finalizacoes.length > 0 ? (
                                                        dadosAba.time2.finalizacoes.map((jogador, index) => (
                                                            <div key={index}>
                                                                {jogador} - {dadosAba.time2.contagemFinalizacoes[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem chutes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 1 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Chutes ao Gol:</strong>
                                                    {dadosAba.time2.chutesAoGol.length > 0 ? (
                                                        dadosAba.time2.chutesAoGol.map((jogador, index) => (
                                                            <div key={index}>
                                                                {jogador} - {dadosAba.time2.contagemChutesAoGol[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem chutes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 2 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Gols:</strong>
                                                    {dadosAba.time2.gols.length > 0 ? (
                                                        dadosAba.time2.gols.map((gol, index) => (
                                                            <div key={index}>
                                                                {gol.jogador} - Minuto: {gol.minuto}’
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem gols</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 3 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Assistências:</strong>
                                                    {dadosAba.time2.assistencias.length > 0 ? (
                                                        dadosAba.time2.assistencias.map((assistencia, index) => (
                                                            <div key={index}>{assistencia.jogador}</div>
                                                        ))
                                                    ) : (
                                                        <div>Sem assistências</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 4 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Desarmes:</strong>
                                                    {dadosAba.time2.desarmes.length > 0 ? (
                                                        dadosAba.time2.desarmes.map((desarme, index) => (
                                                            <div key={index}>
                                                                {desarme} - {dadosAba.time2.contagemDesarmes[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem desarmes</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 5 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Faltas:</strong>
                                                    {dadosAba.time2.faltas.length > 0 ? (
                                                        dadosAba.time2.faltas.map((falta, index) => (
                                                            <div key={index}>
                                                                {falta} - {dadosAba.time2.contagemFaltas[index]}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem faltas</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 6 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Cartões:</strong>
                                                    {dadosAba.time2.cartoes.length > 0 ? (
                                                        dadosAba.time2.cartoes.map((cartao, index) => (
                                                            <div
                                                                key={index}
                                                                className={`flex items-center ${cartao.tipo === 'Vermelho' ? 'text-red-500' : 'text-yellow-500'}`}
                                                            >
                                                                {cartao.jogador} - Minuto: {cartao.minuto}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>Sem cartões</div>
                                                    )}
                                                </div>
                                            )}
                                            {abaSelecionadaTime2 === 7 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Impedimentos:</strong>
                                                    {dadosAba.time2.impedimentos > 0 ? (
                                                        <div>{dadosAba.time2.impedimentos} impedimentos</div>
                                                    ) : (
                                                        <div>Sem impedimentos</div>
                                                    )}
                                                </div>
                                            )}

                                            {abaSelecionadaTime2 === 8 && (
                                                <div className="p-4 border rounded shadow h-[280px] overflow-y-auto">
                                                    <strong className="text-green-400">Escanteios:</strong>
                                                    <div>
                                                        <div>Primeiro Tempo: {dadosAba.time2.escanteios.primeiroTempo}</div>
                                                        <div>Segundo Tempo: {dadosAba.time2.escanteios.segundoTempo}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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

            <Dialog open={dialogOpen} onClose={fecharDialogo}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza de que deseja apagar este jogo? Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={fecharDialogo} color="primary">
                        Não
                    </Button>
                    <Button onClick={confirmarApagarJogo} color="error" autoFocus>
                        Sim
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

