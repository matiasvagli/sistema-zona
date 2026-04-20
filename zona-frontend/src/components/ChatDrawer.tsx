"use client";

import React, { useState, useEffect, useRef } from "react";
import { Drawer, Input, Button, Avatar, Spin, Empty, Badge, notification, Typography, Tooltip } from "antd";
import { SendOutlined, MessageOutlined, CloseOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Text } = Typography;
const API = "http://localhost:8000/api/v1";
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
            const all: Message[] = data.results || data;
            
            // Si recipientId es null, es el chat grupal
            // Si tiene un valor, es un chat privado entre currentUserId y recipientId
            const filtered = all.filter((m) => {
                if (recipientId === null) {
                    return m.recipient === null;
                } else {
                    return (m.sender === currentUserId && m.recipient === recipientId) ||
                           (m.sender === recipientId && m.recipient === currentUserId);
                }
            });
            setMessages(filtered);
        } catch { /* silencioso */ }
    };

    const markRead = async () => {
        try { 
            // Marcamos como leídos solo si estamos en un chat privado o grupal
            await axiosInstance.post(`${API}/messages/mark-read/`, { sender_id: recipientId }); 
        } catch { /* silencioso */ }
    };

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchMessages().finally(() => setLoading(false));
        markRead();

        pollerRef.current = setInterval(fetchMessages, POLL_INTERVAL);
        return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
    }, [open]);

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

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={400}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                        width: 38, height: 38, borderRadius: 12, 
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" 
                    }}>
                        <MessageOutlined style={{ fontSize: 18 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b", lineHeight: 1.2 }}>Chat del Equipo</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Badge status="success" size="small" />
                            <Text style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{recipientName}</Text>
                        </div>
                    </div>
                </div>
            }
            closeIcon={<CloseOutlined style={{ color: "#94a3b8" }} />}
            styles={{
                body: { 
                    display: "flex", 
                    flexDirection: "column", 
                    padding: 0, 
                    height: "100%",
                    background: "#fdfdff" 
                },
                header: { borderBottom: "1px solid #f1f5f9", padding: "16px 20px" },
            }}
        >
            {/* Messages area con fondo estilizado */}
            <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "20px", 
                display: "flex", 
                flexDirection: "column", 
                gap: 16,
                backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)",
                backgroundSize: "20px 20px",
                backgroundColor: "#f8fafc"
            }}>
                {loading ? (
                    <div style={{ textAlign: "center", paddingTop: 80 }}><Spin size="large" /></div>
                ) : messages.length === 0 ? (
                    <div style={{ 
                        textAlign: "center", 
                        paddingTop: 100, 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        gap: 16 
                    }}>
                        <div style={{ 
                            width: 80, height: 80, borderRadius: "50%", 
                            background: "#fff", display: "flex", alignItems: "center", 
                            justifyContent: "center", fontSize: 32,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
                        }}>
                            ✉️
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#64748b" }}>¡Está muy silencioso!</div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Inicia la conversación con el equipo</Text>
                        </div>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUserId;
                    const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender !== msg.sender);

                    return (
                        <div key={msg.id} style={{ 
                            display: "flex", 
                            flexDirection: isMe ? "row-reverse" : "row", 
                            gap: 10, 
                            alignItems: "flex-end"
                        }}>
                            {!isMe && (
                                <div style={{ width: 32, flexShrink: 0 }}>
                                    {showAvatar ? (
                                        <Avatar size={32} style={{ 
                                            background: "linear-gradient(135deg, #7c3aed, #4f46e5)", 
                                            color: "#fff", fontSize: 12, fontWeight: 700,
                                            boxShadow: "0 4px 8px rgba(124,58,237,0.2)"
                                        }}>
                                            {msg.sender_initials}
                                        </Avatar>
                                    ) : <div style={{ width: 32 }} />}
                                </div>
                            )}
                            <div style={{ maxWidth: "80%" }}>
                                {showAvatar && (
                                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, paddingLeft: 4, fontWeight: 600 }}>
                                        {msg.sender_name}
                                    </div>
                                )}
                                <div style={{
                                    background: isMe ? "linear-gradient(135deg, #4f46e5, #0ea5e9)" : "#fff",
                                    color: isMe ? "#fff" : "#334155",
                                    padding: "12px 16px",
                                    borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                                    fontSize: 14,
                                    boxShadow: isMe ? "0 4px 12px rgba(79,70,229,0.25)" : "0 4px 12px rgba(0,0,0,0.03)",
                                    lineHeight: 1.5,
                                    wordBreak: "break-word",
                                    border: isMe ? "none" : "1px solid #f1f5f9"
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{ 
                                    fontSize: 10, 
                                    color: "#94a3b8", 
                                    marginTop: 4, 
                                    textAlign: isMe ? "right" : "left", 
                                    paddingRight: isMe ? 6 : 0, 
                                    paddingLeft: isMe ? 0 : 6,
                                    fontWeight: 500
                                }}>
                                    {dayjs(msg.created_at).format("HH:mm")}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Área con Glassmorphism */}
            <div style={{ 
                padding: "20px", 
                borderTop: "1px solid #f1f5f9", 
                background: "#fff",
                position: "relative"
            }}>
                <div style={{
                    display: "flex", 
                    gap: 10, 
                    alignItems: "flex-end",
                    background: "#f8fafc",
                    padding: "8px 8px 8px 16px",
                    borderRadius: "24px",
                    border: "1px solid #e2e8f0",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                }}>
                    <Input.TextArea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Escribí un mensaje..."
                        autoSize={{ minRows: 1, maxRows: 5 }}
                        variant="borderless"
                        style={{ 
                            padding: "8px 0",
                            fontSize: 14,
                            color: "#1e293b"
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={sending}
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        shape="circle"
                        size="large"
                        style={{ 
                            width: 42, 
                            height: 42, 
                            background: input.trim() ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#e2e8f0", 
                            borderColor: "transparent",
                            boxShadow: input.trim() ? "0 4px 10px rgba(124,58,237,0.3)" : "none",
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
    const [perSender, setPerSender] = useState<Record<number, number>>({});
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
