"use client";

import React, { useState, useEffect, useRef } from "react";
import { Drawer, Input, Button, Avatar, Spin, Empty, Badge, notification, Typography, Tooltip, Popconfirm } from "antd";
import { SendOutlined, MessageOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Text } = Typography;
import { API_URL as API } from "@/config/api";
const POLL_INTERVAL = 4000; // 4 segundos

interface Message {
    id: number;
    sender: number;
    sender_name: string;
    sender_initials: string;
    recipient: number | null;
    content: string;
    is_read: boolean;
    created_at: string;
}

interface ChatDrawerProps {
    open: boolean;
    onClose: () => void;
    currentUserId: number;
    recipientId?: number | null;  // null = chat grupal
    recipientName?: string;
}

export function ChatDrawer({ open, onClose, currentUserId, recipientId = null, recipientName = "Equipo" }: ChatDrawerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMessages = async () => {
        try {
            const { data } = await axiosInstance.get(`${API}/messages/`);
            // Manejamos tanto respuestas paginadas como arrays directos
            const all = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            
            if (all.length === 0) {
                setMessages([]);
                return;
            }

            // Recuperamos la fecha del último vaciado para este usuario y chat específico
            const clearKey = `chat_clear_${currentUserId}_${recipientId || "group"}`;
            const clearDateStr = localStorage.getItem(clearKey);
            const clearDate = clearDateStr ? dayjs(clearDateStr) : null;

            const filtered = all.filter((m: any) => {
                // Filtro por fecha de vaciado individual
                if (clearDate && dayjs(m.created_at).isBefore(clearDate)) {
                    return false;
                }

                // Si no hay recipientId, es el chat de equipo (mensajes con recipient null o 0)
                if (!recipientId) {
                    return !m.recipient;
                }
                
                // Chat privado: comparamos IDs como strings para evitar problemas de tipos
                const mSender = String(m.sender);
                const mRecipient = String(m.recipient);
                const myId = String(currentUserId);
                const targetId = String(recipientId);

                return (mSender === myId && mRecipient === targetId) ||
                       (mSender === targetId && mRecipient === myId);
            });

            setMessages(filtered);
        } catch (err) {
            console.error("Error al obtener mensajes del chat:", err);
        }
    };

    const markRead = async () => {
        try { 
            await axiosInstance.post(`${API}/messages/mark-read/`, { sender_id: recipientId }); 
        } catch (err) {
            console.error("Error al marcar como leído:", err);
        }
    };

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchMessages().finally(() => setLoading(false));
        markRead();

        pollerRef.current = setInterval(fetchMessages, POLL_INTERVAL);
        return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
    }, [open, recipientId]); // Añadimos recipientId a las dependencias por si cambia

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            await axiosInstance.post(`${API}/messages/`, {
                content: input.trim(),
                recipient: recipientId,
            });
            setInput("");
            await fetchMessages();
        } catch { /* silencioso */ }
        finally { setSending(false); }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = async () => {
        try {
            // Guardamos la fecha actual en localStorage para este chat
            const clearKey = `chat_clear_${currentUserId}_${recipientId || "group"}`;
            localStorage.setItem(clearKey, dayjs().toISOString());
            
            // Llamamos al back (opcional, solo para informar)
            await axiosInstance.post(`${API}/messages/clear/`, { sender_id: recipientId });
            
            setMessages([]);
            notification.success({ 
                message: "Chat vaciado localmente",
                description: "El historial ha sido ocultado para tu vista, pero se preserva en el servidor por auditoría." 
            });
        } catch {
            notification.error({ message: "Error al vaciar el chat" });
        }
    };

    const formatMessageDate = (date: string) => {
        const d = dayjs(date);
        if (d.isSame(dayjs(), "day")) return "Hoy";
        if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Ayer";
        return d.format("DD [de] MMMM");
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={420}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ 
                        width: 42, height: 42, borderRadius: 14, 
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#fff", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" 
                    }}>
                        <MessageOutlined style={{ fontSize: 20 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", lineHeight: 1.2 }}>
                            {recipientId ? recipientName : "Canal del Equipo"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <Badge status="success" size="small" />
                            <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>En línea</Text>
                        </div>
                    </div>
                </div>
            }
            extra={
                <Popconfirm
                    title="¿Vaciar chat?"
                    description="Se ocultarán los mensajes de tu vista para mayor orden."
                    onConfirm={clearChat}
                    okText="Vaciar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true, shape: "round" }}
                >
                    <Tooltip title="Limpiar vista de chat">
                        <Button 
                            type="text" 
                            shape="circle"
                            icon={<DeleteOutlined style={{ fontSize: 18 }} />} 
                            style={{ color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}
                        />
                    </Tooltip>
                </Popconfirm>
            }
            closeIcon={<CloseOutlined style={{ color: "#64748b", fontSize: 16 }} />}
            styles={{
                body: { 
                    display: "flex", 
                    flexDirection: "column", 
                    padding: 0, 
                    height: "100%",
                    background: "#f8fafc" 
                },
                header: { 
                    borderBottom: "1px solid rgba(226, 232, 240, 0.8)", 
                    padding: "16px 24px",
                    background: "#fff"
                },
            }}
        >
            {/* Messages area con sutil patrón de fondo */}
            <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "24px 20px", 
                display: "flex", 
                flexDirection: "column", 
                gap: 8,
                backgroundColor: "#f1f5f9",
                backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`,
                scrollBehavior: "smooth"
            }}>
                {loading ? (
                    <div style={{ textAlign: "center", paddingTop: 100 }}><Spin size="large" /></div>
                ) : messages.length === 0 ? (
                    <div style={{ 
                        textAlign: "center", 
                        paddingTop: 120, 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        gap: 20 
                    }}>
                        <div style={{ 
                            width: 90, height: 90, borderRadius: 30, 
                            background: "#fff", display: "flex", alignItems: "center", 
                            justifyContent: "center", fontSize: 40,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
                            transform: "rotate(-10deg)"
                        }}>
                            💬
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: "#334155" }}>Historial impecable</div>
                            <Text type="secondary" style={{ fontSize: 14 }}>Inicia una conversación profesional</Text>
                        </div>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isMe = String(msg.sender) === String(currentUserId);
                    const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender !== msg.sender);
                    
                    const currentDate = dayjs(msg.created_at).format("YYYY-MM-DD");
                    const prevDate = idx > 0 ? dayjs(messages[idx-1].created_at).format("YYYY-MM-DD") : null;
                    const showDateSeparator = currentDate !== prevDate;

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSeparator && (
                                <div style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    margin: "24px 0 16px" 
                                }}>
                                    <div style={{ 
                                        padding: "4px 16px", 
                                        background: "rgba(226, 232, 240, 0.8)", 
                                        backdropFilter: "blur(4px)",
                                        borderRadius: 12, 
                                        fontSize: 11, 
                                        color: "#475569",
                                        fontWeight: 700,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase"
                                    }}>
                                        {formatMessageDate(msg.created_at)}
                                    </div>
                                </div>
                            )}
                            <div style={{ 
                                display: "flex", 
                                flexDirection: isMe ? "row-reverse" : "row", 
                                gap: 12, 
                                alignItems: "flex-end",
                                marginBottom: showAvatar || isMe ? 4 : 2
                            }}>
                                {!isMe && (
                                    <div style={{ width: 36, flexShrink: 0 }}>
                                        {showAvatar ? (
                                            <Avatar size={36} style={{ 
                                                background: "linear-gradient(135deg, #6366f1, #a855f7)", 
                                                color: "#fff", fontSize: 13, fontWeight: 700,
                                                boxShadow: "0 4px 10px rgba(99,102,241,0.3)",
                                                border: "2px solid #fff"
                                            }}>
                                                {msg.sender_initials}
                                            </Avatar>
                                        ) : <div style={{ width: 36 }} />}
                                    </div>
                                )}
                                <div style={{ maxWidth: "75%" }}>
                                    {!isMe && showAvatar && (
                                        <div style={{ fontSize: 12, color: "#475569", marginBottom: 4, paddingLeft: 4, fontWeight: 700 }}>
                                            {msg.sender_name}
                                        </div>
                                    )}
                                    <div style={{
                                        background: isMe ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#fff",
                                        color: isMe ? "#fff" : "#1e293b",
                                        padding: "10px 16px",
                                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                        fontSize: 14,
                                        boxShadow: isMe ? "0 4px 15px rgba(79,70,229,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
                                        lineHeight: 1.5,
                                        wordBreak: "break-word",
                                        border: isMe ? "none" : "1px solid rgba(226, 232, 240, 0.5)",
                                        position: "relative"
                                    }}>
                                        {msg.content}
                                    </div>
                                    <div style={{ 
                                        fontSize: 10, 
                                        color: "#94a3b8", 
                                        marginTop: 4, 
                                        textAlign: isMe ? "right" : "left", 
                                        paddingRight: isMe ? 4 : 0, 
                                        paddingLeft: isMe ? 0 : 4,
                                        fontWeight: 600
                                    }}>
                                        {dayjs(msg.created_at).format("HH:mm")}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Área Premium */}
            <div style={{ 
                padding: "20px 24px 30px", 
                background: "#fff",
                borderTop: "1px solid #f1f5f9",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.02)"
            }}>
                <div style={{
                    display: "flex", 
                    gap: 12, 
                    alignItems: "center",
                    background: "#f8fafc",
                    padding: "6px 6px 6px 18px",
                    borderRadius: "28px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.01)"
                }}>
                    <Input.TextArea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Comenzar charla..."
                        autoSize={{ minRows: 1, maxRows: 5 }}
                        variant="borderless"
                        style={{ 
                            padding: "8px 0",
                            fontSize: 14,
                            color: "#0f172a"
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined style={{ fontSize: 18 }} />}
                        loading={sending}
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        shape="circle"
                        style={{ 
                            width: 44, 
                            height: 44, 
                            background: input.trim() ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#f1f5f9", 
                            borderColor: "transparent",
                            boxShadow: input.trim() ? "0 8px 20px rgba(79,70,229,0.3)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}
                    />
                </div>
            </div>
        </Drawer>
    );
}

/** Botón flotante que abre el chat con badge de mensajes no leídos */
interface ChatButtonProps {
    currentUserId: number;
}

export function ChatFloatingButton({ currentUserId }: ChatButtonProps) {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [perSender, setPerSender] = useState<Record<string | number, number>>({});
    const [users, setUsers] = useState<any[]>([]);
    const lastUnread = useRef(0);

    const fetchData = async () => {
        try {
            const { data: unreadData } = await axiosInstance.get(`${API}/messages/unread-count/`);
            const currentUnread = unreadData.count || 0;
            setUnread(currentUnread);
            setPerSender(unreadData.per_sender || {});

            if (currentUnread > lastUnread.current && !open) {
                notification.info({
                    message: "Mensaje nuevo",
                    description: "Tenés mensajes nuevos en el chat del equipo.",
                    placement: "bottomRight",
                    icon: <MessageOutlined style={{ color: "#7c3aed" }} />,
                    onClick: () => setOpen(true),
                });
            }
            lastUnread.current = currentUnread;

            // Si hay mensajes, buscamos nombres de usuarios para el tooltip
            if (currentUnread > 0 && users.length === 0) {
                const { data: userData } = await axiosInstance.get(`${API}/users/`);
                setUsers(userData.results || userData);
            }
        } catch { /* ... */ }
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 8000);
        return () => clearInterval(id);
    }, [open]);

    const groupUnread = perSender["group"] || 0;

    return (
        <>
            <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999 }}>
                <Tooltip title={groupUnread > 0 ? `Tenés ${groupUnread} mensajes nuevos en Equipo` : "Chat del equipo"} placement="left">
                    <Badge count={groupUnread} size="small" offset={[-4, 4]} color="#52c41a">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<MessageOutlined />}
                            size="large"
                            onClick={() => setOpen(true)}
                            style={{
                                width: 56,
                                height: 56,
                                boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 22,
                                animation: groupUnread > 0 ? "pulse 2s infinite" : "none"
                            }}
                        />
                    </Badge>
                </Tooltip>
            </div>
            <ChatDrawer
                open={open}
                onClose={() => setOpen(false)}
                currentUserId={currentUserId}
            />
        </>
    );
}
