"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Card, Input, Select, Button, Tag, Badge, Modal, Form, InputNumber,
  Table, Space, Tabs, Row, Col, Tooltip, Popconfirm, Typography,
  Spin, Empty, notification, Upload, Divider, Avatar,
} from "antd";
import {
  PlusOutlined, SearchOutlined, WarningOutlined, CheckOutlined,
  CloseOutlined, InboxOutlined, EditOutlined, DeleteOutlined,
  ShoppingCartOutlined, SwapOutlined, ReloadOutlined,
  ExclamationCircleOutlined, AppstoreOutlined, AuditOutlined,
  ShoppingOutlined, CheckCircleOutlined, StopOutlined,
  BarsOutlined, FilterOutlined, ToolOutlined, CoffeeOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import { SECTOR_COLORS } from "@/constants/statuses";

const { Title, Text } = Typography;
const { Search } = Input;

type ReservationStatus = "pendiente" | "aprobada" | "rechazada";
type PurchaseStatus = "pendiente" | "en_compra" | "recibido" | "rechazado";

const RES_STATUS: Record<ReservationStatus, { color: string; label: string; bg: string; dot: string }> = {
  pendiente:  { color: "#d46b08", label: "Pendiente",  bg: "#fff7e6", dot: "#fa8c16" },
  aprobada:   { color: "#237804", label: "Aprobada",   bg: "#f6ffed", dot: "#52c41a" },
  rechazada:  { color: "#a8071a", label: "Rechazada",  bg: "#fff1f0", dot: "#ff4d4f" },
};

const PUR_STATUS: Record<PurchaseStatus, { color: string; label: string; bg: string; dot: string }> = {
  pendiente:  { color: "#d46b08", label: "Pendiente",   bg: "#fff7e6", dot: "#fa8c16" },
  en_compra:  { color: "#003eb3", label: "En compra",   bg: "#e6f4ff", dot: "#1677ff" },
  recibido:   { color: "#237804", label: "Recibido",    bg: "#f6ffed", dot: "#52c41a" },
  rechazado:  { color: "#a8071a", label: "Rechazado",   bg: "#fff1f0", dot: "#ff4d4f" },
};

const COMMON_UNITS = ["m", "m²", "m³", "kg", "g", "L", "unidad", "rollo", "hoja", "caja", "bolsa", "par", "set"];

export default function InventarioPage() {
  const { data: identity } = useGetIdentity<any>();
  const isAdmin = !!(identity?.rol === "admin" || identity?.rol === "ceo" || identity?.is_staff);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("catalogo");

  // Catálogo state
  const [kindFilter, setKindFilter] = useState<"material" | "insumo" | "herramienta">("material");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal producto
  const [productModal, setProductModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [productForm] = Form.useForm();
  const [savingProduct, setSavingProduct] = useState(false);

  // Reservas state
  const [resStatusFilter, setResStatusFilter] = useState<ReservationStatus | "all">("pendiente");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Recibir stock state
  const [receiveModal, setReceiveModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [receiveForm] = Form.useForm();
  const [savingReceive, setSavingReceive] = useState(false);

  // Solicitud de compra state
  const [purchaseReqModal, setPurchaseReqModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [purchaseReqForm] = Form.useForm();
  const [savingPurchaseReq, setSavingPurchaseReq] = useState(false);
  // Recibir pedido (admin)
  const [receiveReqModal, setReceiveReqModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null });
  const [receiveReqForm] = Form.useForm();
  const [savingReceiveReq, setSavingReceiveReq] = useState(false);
  const [reqQtyVal, setReqQtyVal] = useState<number | null>(null);
  const [reqTotalVal, setReqTotalVal] = useState<number | null>(null);
  // Recibir stock directo
  const [recvQtyVal, setRecvQtyVal] = useState<number | null>(null);
  const [recvTotalVal, setRecvTotalVal] = useState<number | null>(null);
  // Filtro tab compras
  const [purStatusFilter, setPurStatusFilter] = useState<PurchaseStatus | "all">("pendiente");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Data fetching
  const { result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    pagination: { pageSize: 100 },
    queryOptions: { queryKey: ["sectors", refreshKey] } as any,
  });
  const sectors: any[] = sectorsResult?.data || [];
  const sectorMap = Object.fromEntries(sectors.map((s, i) => [s.id, { ...s, colorIdx: i }]));

  const { result: productsResult, query: productsQuery } = useList({
    resource: "products",
    pagination: { pageSize: 500 },
    queryOptions: { queryKey: ["products", refreshKey] } as any,
  });
  const allProducts: any[] = productsResult?.data || [];

  const { result: reservationsResult, query: reservationsQuery } = useList({
    resource: "material-reservations",
    pagination: { pageSize: 200 },
    queryOptions: { queryKey: ["material-reservations", refreshKey] } as any,
  });
  const allReservations: any[] = reservationsResult?.data || [];

  const { result: purchaseReqsResult } = useList({
    resource: "purchase-requests",
    pagination: { pageSize: 200 },
    queryOptions: { queryKey: ["purchase-requests", refreshKey] } as any,
  });
  const allPurchaseReqs: any[] = purchaseReqsResult?.data || [];

  // Derived stats
  const lowStockCount       = allProducts.filter((p) => p.stock_bajo).length;
  const pendingCount        = allReservations.filter((r) => r.status === "pendiente").length;
  const pendingPurchaseCount = allPurchaseReqs.filter((r) => r.status === "pendiente").length;

  // Filtered products
  const filteredProducts = allProducts.filter((p) => {
    const matchKind = (p.kind ?? "material") === kindFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = !sectorFilter || p.sector === sectorFilter;
    const matchLowStock = !showLowStockOnly || p.stock_bajo;
    return matchKind && matchSearch && matchSector && matchLowStock;
  });

  // Group by sector
  const byGlobal    = filteredProducts.filter((p) => !p.sector);
  const bySector    = sectors.map((s) => ({
    sector: s,
    products: filteredProducts.filter((p) => p.sector === s.id),
  })).filter((g) => g.products.length > 0);

  // Filtered reservations
  const filteredReservations = allReservations.filter((r) =>
    resStatusFilter === "all" || r.status === resStatusFilter
  );

  // ── Producto CRUD ──────────────────────────────────────────────────────
  const openAddModal = () => {
    productForm.resetFields();
    productForm.setFieldValue("kind", kindFilter);
    setProductModal({ open: true, editing: null });
  };

  const openEditModal = (product: any) => {
    productForm.setFieldsValue({
      name: product.name,
      kind: product.kind ?? "material",
      unit: product.unit,
      stock_qty: product.stock_qty,
      alert_qty: product.alert_qty,
      sector: product.sector ?? undefined,
      unit_price: product.unit_price ?? undefined,
      serial_number: product.serial_number ?? "",
      asset_status: product.asset_status ?? "activa",
    });
    setProductModal({ open: true, editing: product });
  };

  const saveProduct = async () => {
    try {
      const values = await productForm.validateFields();
      setSavingProduct(true);
      if (productModal.editing) {
        await axiosInstance.patch(`${API}/products/${productModal.editing.id}/`, values);
        notification.success({ message: "Producto actualizado" });
      } else {
        await axiosInstance.post(`${API}/products/`, values);
        notification.success({ message: "Producto creado" });
      }
      setProductModal({ open: false, editing: null });
      productForm.resetFields();
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return; // validation error, handled by Form
      notification.error({ message: e?.response?.data?.detail || "Error al guardar el producto" });
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await axiosInstance.delete(`${API}/products/${id}/`);
      notification.success({ message: "Producto eliminado" });
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "No se puede eliminar (puede tener reservas activas)" });
    }
  };

  // ── Solicitud de compra ───────────────────────────────────────────────
  const submitPurchaseRequest = async () => {
    try {
      const values = await purchaseReqForm.validateFields();
      setSavingPurchaseReq(true);
      await axiosInstance.post(`${API}/purchase-requests/`, {
        product: purchaseReqModal.product.id,
        quantity_requested: values.quantity_requested,
        notes: values.notes || "",
      });
      notification.success({ message: "Solicitud enviada al admin" });
      setPurchaseReqModal({ open: false, product: null });
      purchaseReqForm.resetFields();
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: e?.response?.data?.detail || "Error al enviar la solicitud" });
    } finally {
      setSavingPurchaseReq(false);
    }
  };

  const markOrdered = async (id: number) => {
    setActionLoading(id);
    try {
      await axiosInstance.post(`${API}/purchase-requests/${id}/mark_ordered/`);
      notification.success({ message: "Marcado como en compra" });
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error" });
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPurchaseRequest = async (id: number, reason: string) => {
    setActionLoading(id);
    try {
      await axiosInstance.post(`${API}/purchase-requests/${id}/reject/`, { reason });
      notification.success({ message: "Solicitud rechazada" });
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error" });
    } finally {
      setActionLoading(null);
    }
  };

  const submitReceiveReq = async () => {
    try {
      const values = await receiveReqForm.validateFields();
      setSavingReceiveReq(true);
      const unitPrice = values.purchase_total && values.quantity_received
        ? values.purchase_total / values.quantity_received
        : null;
      await axiosInstance.post(`${API}/purchase-requests/${receiveReqModal.req.id}/receive/`, {
        quantity_received: values.quantity_received,
        purchase_price: unitPrice,
      });
      notification.success({ message: "Stock actualizado — pedido recibido" });
      setReceiveReqModal({ open: false, req: null });
      receiveReqForm.resetFields();
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: e?.response?.data?.detail || "Error al recibir" });
    } finally {
      setSavingReceiveReq(false);
    }
  };

  // ── Recibir stock ─────────────────────────────────────────────────────
  const receiveStock = async () => {
    try {
      const values = await receiveForm.validateFields();
      setSavingReceive(true);
      const kind = receiveModal.product?.kind;
      const payload: Record<string, any> = {
        product: receiveModal.product.id,
        qty: values.qty,
        reason: values.reason || "Ingreso de stock",
      };
      if (isAdmin && values.purchase_total) {
        if (kind === "material") {
          // Para materiales: precio unitario actualiza el promedio ponderado
          payload.purchase_price = values.purchase_total / values.qty;
        } else {
          // Para insumos/herramientas: solo el total para el gasto
          payload.total_cost = values.purchase_total;
        }
      }
      await axiosInstance.post(`${API}/stock-movements/`, payload);
      notification.success({ message: "Stock actualizado correctamente" });
      setReceiveModal({ open: false, product: null });
      receiveForm.resetFields();
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: e?.response?.data?.detail || e?.response?.data?.qty?.[0] || "Error al registrar el ingreso" });
    } finally {
      setSavingReceive(false);
    }
  };

  // ── Reservas ──────────────────────────────────────────────────────────
  const approveReservation = async (id: number) => {
    setActionLoading(id);
    try {
      const { data } = await axiosInstance.post(`${API}/material-reservations/${id}/approve/`);
      if (data.warning) {
        notification.warning({ message: "Aprobado con advertencia", description: data.warning, duration: 8 });
      } else {
        notification.success({ message: "Reserva aprobada — stock descontado" });
      }
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al aprobar" });
    } finally {
      setActionLoading(null);
    }
  };

  const rejectReservation = async () => {
    if (!rejectModal.id) return;
    setActionLoading(rejectModal.id);
    try {
      await axiosInstance.post(`${API}/material-reservations/${rejectModal.id}/reject/`, { reason: rejectReason });
      notification.success({ message: "Reserva rechazada" });
      setRejectModal({ open: false, id: null });
      setRejectReason("");
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al rechazar" });
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = productsQuery.isLoading;

  // ── Render helpers ────────────────────────────────────────────────────
  const ProductCard = ({ product }: { product: any }) => {
    const sector = sectorMap[product.sector];
    const palette = sector ? SECTOR_COLORS[sector.colorIdx % SECTOR_COLORS.length] : null;
    const isLow = product.stock_bajo;

    return (
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        borderTop: `4px solid ${palette?.solid ?? "#94a3b8"}`,
        padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease-in-out",
        cursor: "default",
        position: "relative",
      }}
        onMouseEnter={(e) => { 
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; 
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; 
            (e.currentTarget as HTMLDivElement).style.borderColor = "#94a3b8";
        }}
        onMouseLeave={(e) => { 
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; 
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; 
            (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
        }}
      >
        {/* Header: Sector + acciones admin + alerta */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Tag sector */}
          {palette ? (
            <Tag color={palette.solid} style={{ borderRadius: 10, border: "none", fontWeight: 600, padding: "1px 8px", margin: 0, fontSize: 11 }}>
              {sector?.name}
            </Tag>
          ) : (
            <Tag color="default" style={{ borderRadius: 10, border: "none", fontWeight: 600, padding: "1px 8px", margin: 0, fontSize: 11 }}>
              Global
            </Tag>
          )}

          {/* Espaciador */}
          <div style={{ flex: 1 }} />

          {/* Alerta stock bajo */}
          {isLow && (
            <Tooltip title={`Stock bajo — mínimo: ${product.alert_qty} ${product.unit}`}>
              <div style={{
                background: "#fff7e6", padding: "2px 6px", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 3, color: "#fa8c16", fontWeight: 700, fontSize: 10
              }}>
                <WarningOutlined style={{ fontSize: 10 }} /> Bajo
              </div>
            </Tooltip>
          )}

          {/* Edit / Delete (solo admin) */}
          {isAdmin && (
            <>
              <Tooltip title="Editar">
                <Button
                  type="text" size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(product)}
                  style={{ color: "#94a3b8", padding: "0 3px", height: 20, minWidth: 20 }}
                />
              </Tooltip>
              <Popconfirm
                title="¿Eliminar producto?"
                description="Esta acción no se puede deshacer."
                onConfirm={() => deleteProduct(product.id)}
                okText="Eliminar" okButtonProps={{ danger: true }}
                cancelText="Cancelar"
              >
                <Tooltip title="Eliminar">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ padding: "0 3px", height: 20, minWidth: 20 }} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </div>

        {/* Nombre */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, minHeight: 32 }}>
            {product.name}
        </div>

        {/* Stock Principal */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, background: isLow ? "#fff1f0" : "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
          <span style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1,
            color: isLow ? "#f5222d" : "#0f172a",
          }}>
            {Number(product.available_qty ?? product.stock_qty).toLocaleString("es-AR")}
          </span>
          <span style={{ fontSize: 12, color: isLow ? "#f5222d" : "#64748b", fontWeight: 500 }}>{product.unit} <span style={{ fontSize: 11, fontWeight: 400 }}>disp.</span></span>
        </div>

        {/* Detalles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 2px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                <span>Total físico:</span>
                <span style={{ fontWeight: 600, color: "#334155" }}>{Number(product.stock_qty).toLocaleString("es-AR")} {product.unit}</span>
            </div>
            {Number(product.reserved_qty) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#d46b08" }}>
                    <span>Reservado:</span>
                    <span style={{ fontWeight: 600 }}>{Number(product.reserved_qty).toLocaleString("es-AR")} {product.unit}</span>
                </div>
            )}
            {product.alert_qty > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
                    <span>Mínimo alerta:</span>
                    <span style={{ fontWeight: 500 }}>{product.alert_qty} {product.unit}</span>
                </div>
            )}
            {isAdmin && product.unit_price != null && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#0ea5e9", marginTop: 3, paddingTop: 3, borderTop: "1px dashed #e2e8f0" }}>
                    <span>Precio prom.:</span>
                    <span style={{ fontWeight: 600 }}>${Number(product.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Botones — solo para material e insumo */}
        {product.kind !== "herramienta" && (
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Button
              type="primary" size="small" icon={<InboxOutlined />}
              onClick={() => { setReceiveModal({ open: true, product }); receiveForm.resetFields(); }}
              style={{ flex: 1, borderRadius: 6, background: "#1677ff", fontSize: 12 }}
            >
              Recibir
            </Button>
            <Tooltip title="Pedirle al admin que compre más stock">
              <Button
                size="small" icon={<ShoppingCartOutlined />}
                onClick={() => { setPurchaseReqModal({ open: true, product }); purchaseReqForm.resetFields(); }}
                style={{ flex: 1, borderRadius: 6, color: "#fa8c16", borderColor: "#ffd591", background: "#fff7e6", fontSize: 12 }}
              >
                Pedir
              </Button>
            </Tooltip>
          </div>
        )}

        {/* Herramienta: serial + estado */}
        {product.kind === "herramienta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {product.serial_number && (
              <div style={{ fontSize: 11, color: "#64748b" }}>
                <ToolOutlined style={{ marginRight: 4 }} />Serie: <strong>{product.serial_number}</strong>
              </div>
            )}
            <div style={{ fontSize: 11 }}>
              <span style={{
                padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                background: product.asset_status === "activa" ? "#f6ffed" : product.asset_status === "en_reparacion" ? "#fff7e6" : "#fff1f0",
                color: product.asset_status === "activa" ? "#237804" : product.asset_status === "en_reparacion" ? "#d46b08" : "#a8071a",
              }}>
                {product.asset_status === "activa" ? "Activa" : product.asset_status === "en_reparacion" ? "En reparación" : "Baja"}
              </span>
            </div>
          </div>
        )}


      </div>
    );
  };

  const SectorGroup = ({ sector, products }: { sector: any; products: any[] }) => {
    const colorIdx = sectorMap[sector.id]?.colorIdx ?? 0;
    const palette = SECTOR_COLORS[colorIdx % SECTOR_COLORS.length];
    const lowCount = products.filter((p) => p.stock_bajo).length;

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          paddingBottom: 10, borderBottom: `2px solid ${palette.border}20`,
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: palette.solid, flexShrink: 0,
          }} />
          <Text strong style={{ fontSize: 16 }}>{sector.name}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{products.length} producto{products.length !== 1 ? "s" : ""}</Text>
          {lowCount > 0 && (
            <Tag icon={<WarningOutlined />} color="warning" style={{ marginLeft: 4 }}>
              {lowCount} bajo stock
            </Tag>
          )}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 10,
        }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    );
  };

  // Reservations table columns
  const resColumns = [
    {
      title: "OT",
      dataIndex: "work_order_id",
      key: "ot",
      render: (v: number) => <Text strong style={{ fontSize: 12 }}>OT-{String(v).padStart(4, "0")}</Text>,
      width: 80,
    },
    {
      title: "Sector",
      dataIndex: "sector_task_sector",
      key: "sector",
      render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: "Producto",
      key: "product",
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.product_name}</Text>
          {r.is_cross_sector && (
            <Tooltip title="Producto de otro sector">
              <Tag icon={<SwapOutlined />} color="purple" style={{ marginLeft: 6, fontSize: 10 }}>cross</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Cantidad",
      key: "qty",
      render: (_: any, r: any) => <Text style={{ fontSize: 13 }}>{r.quantity} <Text type="secondary" style={{ fontSize: 11 }}>{r.product_unit}</Text></Text>,
      width: 110,
    },
    {
      title: "Stock actual",
      dataIndex: "product_stock",
      key: "stock",
      render: (v: number, r: any) => {
        const insufficient = Number(v) < Number(r.quantity);
        return (
          <Text style={{ color: insufficient ? "#fa8c16" : "#237804", fontWeight: 600, fontSize: 13 }}>
            {Number(v).toLocaleString("es-AR")} {r.product_unit}
            {insufficient && <WarningOutlined style={{ marginLeft: 4 }} />}
          </Text>
        );
      },
      width: 120,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (v: ReservationStatus) => {
        const cfg = RES_STATUS[v] ?? RES_STATUS.pendiente;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: cfg.bg, color: cfg.color, fontWeight: 600,
            fontSize: 11, padding: "3px 10px", borderRadius: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
          </span>
        );
      },
      width: 110,
    },
    {
      title: "Pedido por",
      dataIndex: "requested_by_name",
      key: "req",
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_: any, r: any) => {
        if (r.status !== "pendiente" || !isAdmin) {
          if (r.status === "rechazada" && r.rejection_reason) {
            return (
              <Tooltip title={`Motivo: ${r.rejection_reason}`}>
                <Text type="secondary" style={{ fontSize: 11, cursor: "help" }}>
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  Ver motivo
                </Text>
              </Tooltip>
            );
          }
          return null;
        }
        return (
          <Space>
            <Popconfirm
              title="¿Aprobar esta reserva?"
              description="Se descontará el stock inmediatamente."
              onConfirm={() => approveReservation(r.id)}
              okText="Aprobar" okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
              cancelText="No"
            >
              <Button
                size="small" icon={<CheckOutlined />}
                loading={actionLoading === r.id}
                style={{ color: "#237804", borderColor: "#b7eb8f", background: "#f6ffed", fontSize: 12 }}
              >
                Aprobar
              </Button>
            </Popconfirm>
            <Button
              size="small" danger icon={<CloseOutlined />}
              onClick={() => { setRejectModal({ open: true, id: r.id }); setRejectReason(""); }}
              style={{ fontSize: 12 }}
            >
              Rechazar
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1677ff 100%)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(15,23,42,0.25)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Inventario
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            Gestión de materiales por sector
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{allProducts.length}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>productos</div>
          </div>
          <div style={{
            background: lowStockCount > 0 ? "rgba(250,140,22,0.2)" : "rgba(255,255,255,0.1)",
            border: lowStockCount > 0 ? "1px solid rgba(250,140,22,0.5)" : "none",
            borderRadius: 12, padding: "12px 20px", textAlign: "center",
          }}>
            <div style={{ color: lowStockCount > 0 ? "#fbbf24" : "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{lowStockCount}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>bajo stock</div>
          </div>
          {isAdmin && (
            <div style={{
              background: pendingCount > 0 ? "rgba(250,140,22,0.2)" : "rgba(255,255,255,0.1)",
              border: pendingCount > 0 ? "1px solid rgba(250,140,22,0.5)" : "none",
              borderRadius: 12, padding: "12px 20px", textAlign: "center",
              cursor: pendingCount > 0 ? "pointer" : "default",
            }}
              onClick={() => pendingCount > 0 && setActiveTab("reservas")}
            >
              <div style={{ color: pendingCount > 0 ? "#fbbf24" : "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{pendingCount}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>reservas pendientes</div>
            </div>
          )}
          {isAdmin && (
            <div style={{
              background: pendingPurchaseCount > 0 ? "rgba(22,119,255,0.2)" : "rgba(255,255,255,0.1)",
              border: pendingPurchaseCount > 0 ? "1px solid rgba(22,119,255,0.5)" : "none",
              borderRadius: 12, padding: "12px 20px", textAlign: "center",
              cursor: pendingPurchaseCount > 0 ? "pointer" : "default",
            }}
              onClick={() => pendingPurchaseCount > 0 && setActiveTab("compras")}
            >
              <div style={{ color: pendingPurchaseCount > 0 ? "#69b1ff" : "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{pendingPurchaseCount}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 }}>pedidos de compra</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        tabBarStyle={{
          marginBottom: 20, padding: "0 8px",
          background: "#fff", borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "none",
        }}
        tabBarExtraContent={
          <Button icon={<ReloadOutlined />} onClick={refresh} style={{ margin: "0 8px 0 0" }} />
        }
        items={[
          {
            key: "catalogo",
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <AppstoreOutlined style={{ fontSize: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Catálogo</span>
              </div>
            ),
            children: (
              <div>
                {/* Kind filter */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {([
                    { key: "material",    label: "Materiales",   icon: <AppstoreOutlined /> },
                    { key: "insumo",      label: "Insumos",      icon: <CoffeeOutlined /> },
                    { key: "herramienta", label: "Herramientas", icon: <ToolOutlined /> },
                  ] as const).map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => { setKindFilter(key); setSearch(""); setSectorFilter(null); setShowLowStockOnly(false); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 16px", borderRadius: 20, cursor: "pointer",
                        border: kindFilter === key ? "2px solid #1677ff" : "1.5px solid #e2e8f0",
                        background: kindFilter === key ? "#e6f4ff" : "#fff",
                        color: kindFilter === key ? "#1677ff" : "#64748b",
                        fontWeight: kindFilter === key ? 700 : 500,
                        fontSize: 13, transition: "all 0.18s",
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                  <Search
                    placeholder="Buscar producto..."
                    allowClear
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 240 }}
                  />
                  <Select
                    placeholder="Sector"
                    allowClear
                    style={{ width: 180 }}
                    value={sectorFilter}
                    onChange={(v) => setSectorFilter(v ?? null)}
                    options={[
                      { value: null as any, label: "Productos globales" },
                      ...sectors.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                  />
                  <Button 
                    type={showLowStockOnly ? "primary" : "default"}
                    danger={showLowStockOnly}
                    icon={<FilterOutlined />}
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    style={{ borderRadius: 8 }}
                  >
                    Bajo Stock
                  </Button>
                  <div style={{ flex: 1 }} />
                  
                  {/* View Toggles */}
                  <div style={{ background: "#f1f5f9", padding: 4, borderRadius: 8, display: "flex", gap: 4 }}>
                    <Button 
                        type={viewMode === "cards" ? "primary" : "text"} 
                        icon={<AppstoreOutlined />} 
                        onClick={() => setViewMode("cards")}
                        style={{ borderRadius: 6, boxShadow: viewMode === "cards" ? "0 2px 6px rgba(0,0,0,0.1)" : "none" }}
                    />
                    <Button 
                        type={viewMode === "table" ? "primary" : "text"} 
                        icon={<BarsOutlined />} 
                        onClick={() => setViewMode("table")}
                        style={{ borderRadius: 6, boxShadow: viewMode === "table" ? "0 2px 6px rgba(0,0,0,0.1)" : "none" }}
                    />
                  </div>

                  {isAdmin && (
                    <Button
                      type="primary" icon={<PlusOutlined />}
                      onClick={openAddModal}
                      style={{ borderRadius: 8, marginLeft: 8 }}
                    >
                      Nuevo producto
                    </Button>
                  )}
                </div>

                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
                ) : filteredProducts.length === 0 ? (
                  <Empty description="No hay productos que coincidan" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "60px 0" }} />
                ) : viewMode === "table" ? (
                  <Table 
                    dataSource={filteredProducts} 
                    rowKey="id" 
                    pagination={{ pageSize: 20 }}
                    style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}
                    columns={[
                      {
                        title: "Nombre",
                        dataIndex: "name",
                        key: "name",
                        render: (v, r: any) => (
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{v}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{r.sector ? sectorMap[r.sector]?.name : "Global"}</div>
                          </div>
                        )
                      },
                      {
                        title: "Disponible",
                        key: "available",
                        render: (_, r: any) => (
                          <span style={{ fontWeight: 700, color: r.stock_bajo ? "#f5222d" : "#0f172a" }}>
                            {Number(r.available_qty ?? r.stock_qty).toLocaleString("es-AR")} {r.unit}
                            {r.stock_bajo && <WarningOutlined style={{ color: "#f5222d", marginLeft: 6 }} />}
                          </span>
                        )
                      },
                      {
                        title: "Reservado",
                        dataIndex: "reserved_qty",
                        key: "reserved",
                        render: (v, r: any) => <span style={{ color: Number(v) > 0 ? "#d46b08" : "#94a3b8" }}>{Number(v).toLocaleString("es-AR")} {r.unit}</span>
                      },
                      {
                        title: "Físico (Total)",
                        dataIndex: "stock_qty",
                        key: "total",
                        render: (v, r: any) => <span style={{ color: "#64748b" }}>{Number(v).toLocaleString("es-AR")} {r.unit}</span>
                      },
                      {
                        title: "Mínimo",
                        dataIndex: "alert_qty",
                        key: "alert",
                        render: (v, r: any) => <span style={{ color: "#94a3b8" }}>{v} {r.unit}</span>
                      },
                      {
                        title: "Acciones",
                        key: "actions",
                        width: 180,
                        render: (_, r: any) => (
                          <div style={{ display: "flex", gap: 6 }}>
                            <Tooltip title="Recibir">
                              <Button size="small" type="primary" icon={<InboxOutlined />} onClick={() => { setReceiveModal({ open: true, product: r }); receiveForm.resetFields(); }} />
                            </Tooltip>
                            <Tooltip title="Pedir">
                              <Button size="small" icon={<ShoppingCartOutlined />} style={{ color: "#fa8c16", borderColor: "#ffd591", background: "#fff7e6" }} onClick={() => { setPurchaseReqModal({ open: true, product: r }); purchaseReqForm.resetFields(); }} />
                            </Tooltip>
                            {isAdmin && (
                              <>
                                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
                                <Popconfirm title="¿Eliminar?" onConfirm={() => deleteProduct(r.id)} okButtonProps={{ danger: true }}>
                                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                ) : (
                  <div>
                    {/* Productos sin sector */}
                    {!sectorFilter && byGlobal.length > 0 && (
                      <div style={{ marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: "2px solid #f0f0f0" }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#d9d9d9", flexShrink: 0 }} />
                          <Text strong style={{ fontSize: 16 }}>Global / Compartidos</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>{byGlobal.length} producto{byGlobal.length !== 1 ? "s" : ""}</Text>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                          {byGlobal.map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                      </div>
                    )}

                    {/* Productos por sector */}
                    {bySector.map(({ sector, products }) => (
                      <SectorGroup key={sector.id} sector={sector} products={products} />
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          ...(isAdmin ? [
          {
            key: "compras",
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <Badge count={pendingPurchaseCount} size="small" offset={[4, -2]}>
                  <ShoppingOutlined style={{ fontSize: 16 }} />
                </Badge>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Compras</span>
              </div>
            ),
            children: (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {(["pendiente", "en_compra", "recibido", "rechazado", "all"] as const).map((s) => {
                    const active = purStatusFilter === s;
                    const cfg = s === "all" ? null : PUR_STATUS[s];
                    const count = s === "all"
                      ? allPurchaseReqs.length
                      : allPurchaseReqs.filter((r) => r.status === s).length;
                    return (
                      <button key={s} onClick={() => setPurStatusFilter(s)} style={{
                        padding: "6px 16px", borderRadius: 20, cursor: "pointer",
                        border: active ? `2px solid ${cfg?.dot ?? "#1890ff"}` : "1px solid #e2e8f0",
                        background: active ? (cfg?.bg ?? "#e6f4ff") : "#fff",
                        color: active ? (cfg?.color ?? "#003eb3") : "#595959",
                        fontWeight: active ? 700 : 400, fontSize: 13, transition: "all 0.2s",
                      }}>
                        {s === "all" ? "Todas" : cfg?.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <Table
                  dataSource={allPurchaseReqs.filter((r) => purStatusFilter === "all" || r.status === purStatusFilter)}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  style={{ background: "#fff", borderRadius: 12 }}
                  locale={{ emptyText: <Empty description="Sin solicitudes" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  columns={[
                    {
                      title: "Producto",
                      key: "product",
                      render: (_: any, r: any) => (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{r.product_name}</Text>
                          {r.product_stock <= r.product_alert && r.product_alert > 0 && (
                            <Tag icon={<WarningOutlined />} color="warning" style={{ marginLeft: 6, fontSize: 10 }}>bajo stock</Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: "Cant. solicitada",
                      key: "qty",
                      render: (_: any, r: any) => (
                        <Text style={{ fontSize: 13 }}>{r.quantity_requested} <Text type="secondary" style={{ fontSize: 11 }}>{r.product_unit}</Text></Text>
                      ),
                      width: 130,
                    },
                    {
                      title: "Stock actual",
                      dataIndex: "product_stock",
                      key: "stock",
                      render: (v: number, r: any) => (
                        <Text style={{ color: v <= r.product_alert && r.product_alert > 0 ? "#fa8c16" : "#237804", fontWeight: 600, fontSize: 13 }}>
                          {Number(v).toLocaleString("es-AR")} {r.product_unit}
                        </Text>
                      ),
                      width: 120,
                    },
                    {
                      title: "Notas",
                      dataIndex: "notes",
                      key: "notes",
                      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || "—"}</Text>,
                    },
                    {
                      title: "Estado",
                      dataIndex: "status",
                      key: "status",
                      render: (v: PurchaseStatus) => {
                        const cfg = PUR_STATUS[v] ?? PUR_STATUS.pendiente;
                        return (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: cfg.bg, color: cfg.color, fontWeight: 600,
                            fontSize: 11, padding: "3px 10px", borderRadius: 20,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                            {cfg.label}
                          </span>
                        );
                      },
                      width: 110,
                    },
                    {
                      title: "Pedido por",
                      dataIndex: "requested_by_name",
                      key: "req",
                      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
                      width: 120,
                    },
                    {
                      title: "Recibido",
                      key: "received",
                      render: (_: any, r: any) => r.status === "recibido" ? (
                        <div>
                          <Text strong style={{ fontSize: 12 }}>{r.quantity_received} {r.product_unit}</Text>
                          {r.purchase_price && (
                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                              ${Number(r.purchase_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })} / {r.product_unit}
                            </Text>
                          )}
                        </div>
                      ) : null,
                      width: 120,
                    },
                    {
                      title: "Acciones",
                      key: "actions",
                      width: 200,
                      render: (_: any, r: any) => {
                        if (r.status === "recibido" || r.status === "rechazado") {
                          return r.status === "rechazado" && r.rejection_reason ? (
                            <Tooltip title={`Motivo: ${r.rejection_reason}`}>
                              <Text type="secondary" style={{ fontSize: 11, cursor: "help" }}>
                                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                                Ver motivo
                              </Text>
                            </Tooltip>
                          ) : null;
                        }
                        return (
                          <Space size={4} wrap>
                            {r.status === "pendiente" && (
                              <Popconfirm
                                title="¿Marcar como en compra?"
                                onConfirm={() => markOrdered(r.id)}
                                okText="Sí" cancelText="No"
                              >
                                <Button
                                  size="small" icon={<ShoppingOutlined />}
                                  loading={actionLoading === r.id}
                                  style={{ color: "#003eb3", borderColor: "#91caff", background: "#e6f4ff", fontSize: 12 }}
                                >
                                  En compra
                                </Button>
                              </Popconfirm>
                            )}
                            <Button
                              size="small" icon={<CheckCircleOutlined />}
                              onClick={() => { setReceiveReqModal({ open: true, req: r }); receiveReqForm.resetFields(); receiveReqForm.setFieldsValue({ quantity_received: r.quantity_requested }); }}
                              style={{ color: "#237804", borderColor: "#b7eb8f", background: "#f6ffed", fontSize: 12 }}
                            >
                              Recibido
                            </Button>
                            <Popconfirm
                              title="¿Rechazar solicitud?"
                              onConfirm={() => rejectPurchaseRequest(r.id, "")}
                              okText="Rechazar" okButtonProps={{ danger: true }}
                              cancelText="No"
                            >
                              <Button size="small" danger icon={<StopOutlined />} style={{ fontSize: 12 }} />
                            </Popconfirm>
                          </Space>
                        );
                      },
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: "reservas",
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <Badge count={pendingCount} size="small" offset={[4, -2]}>
                  <AuditOutlined style={{ fontSize: 16 }} />
                </Badge>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Reservas</span>
              </div>
            ),
            children: (
              <div>
                {/* Filtro estado */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {(["pendiente", "aprobada", "rechazada", "all"] as const).map((s) => {
                    const active = resStatusFilter === s;
                    const cfg = s === "all" ? null : RES_STATUS[s];
                    const count = s === "all"
                      ? allReservations.length
                      : allReservations.filter((r) => r.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => setResStatusFilter(s)}
                        style={{
                          padding: "6px 16px", borderRadius: 20, cursor: "pointer",
                          border: active ? `2px solid ${cfg?.dot ?? "#1890ff"}` : "1px solid #e2e8f0",
                          background: active ? (cfg?.bg ?? "#e6f4ff") : "#fff",
                          color: active ? (cfg?.color ?? "#003eb3") : "#595959",
                          fontWeight: active ? 700 : 400, fontSize: 13,
                          transition: "all 0.2s",
                        }}
                      >
                        {s === "all" ? "Todas" : cfg?.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <Table
                  dataSource={filteredReservations}
                  columns={resColumns}
                  rowKey="id"
                  loading={reservationsQuery.isLoading}
                  size="small"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  style={{ background: "#fff", borderRadius: 12 }}
                  locale={{ emptyText: <Empty description="Sin reservas" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  rowClassName={(r) => r.is_cross_sector ? "cross-sector-row" : ""}
                />
              </div>
            ),
          }] : []),
        ]}
      />

      {/* ── Modal Nuevo/Editar Producto ─────────────────────────────── */}
      <Modal
        title={productModal.editing ? `Editar — ${productModal.editing.name}` : "Nuevo Producto"}
        open={productModal.open}
        onCancel={() => { setProductModal({ open: false, editing: null }); productForm.resetFields(); }}
        onOk={saveProduct}
        confirmLoading={savingProduct}
        okText={productModal.editing ? "Guardar cambios" : "Crear producto"}
        width={480}
        destroyOnClose
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "Ingresá el nombre" }]}>
                <Input placeholder="Ej: Lona vinílica, Taladro Bosch..." size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="kind" label="Tipo" initialValue="material">
                <Select size="large" options={[
                  { value: "material",    label: "Material" },
                  { value: "insumo",      label: "Insumo" },
                  { value: "herramienta", label: "Herramienta" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="unit" label="Unidad" rules={[{ required: true, message: "Ingresá la unidad" }]}>
                <Select
                  showSearch allowClear={false} size="large"
                  placeholder="m, kg, unidad..."
                  options={COMMON_UNITS.map((u) => ({ value: u, label: u }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sector" label="Sector">
                <Select size="large" allowClear placeholder="Global (sin sector)">
                  {sectors.map((s) => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.kind !== cur.kind}>
            {({ getFieldValue }) => {
              const kind = getFieldValue("kind");
              if (kind === "material") return (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="stock_qty" label="Stock actual" initialValue={0}>
                        <InputNumber min={0} step={0.5} style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="alert_qty" label="Alerta mínima" initialValue={0}>
                        <InputNumber min={0} step={0.5} style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isAdmin && !productModal.editing && (
                    <Form.Item
                      name="purchase_total"
                      label="Precio total del stock inicial (opcional)"
                      tooltip="Si ya sabés cuánto pagaste por ese stock, ingresalo para inicializar el precio promedio. El sistema divide por la cantidad y lo usa como base para futuros promedios."
                    >
                      <InputNumber min={0} step={100} prefix="$" style={{ width: "100%" }} size="large" placeholder="ej: 5000 si compraste 5m a $1000/m" />
                    </Form.Item>
                  )}
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae0ff", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: "#0369a1" }}>
                      El precio de costo por unidad se calcula automáticamente con cada ingreso de stock con precio.
                    </Text>
                  </div>
                </>
              );
              if (kind === "insumo") return (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="stock_qty" label="Stock inicial" initialValue={0}
                        tooltip="Cantidad que tenés en este momento. Queda registrado como ingreso de stock.">
                        <InputNumber min={0} step={0.5} style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="alert_qty" label="Alerta mínima" initialValue={0}>
                        <InputNumber min={0} step={0.5} style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isAdmin && (
                    <Form.Item name="purchase_total" label="Costo total pagado (opcional)"
                      tooltip="Lo que gastaste en total. Se registra automáticamente como gasto operativo.">
                      <InputNumber min={0} step={100} prefix="$" style={{ width: "100%" }} size="large" placeholder="0.00" />
                    </Form.Item>
                  )}
                </>
              );
              if (kind === "herramienta") return (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="stock_qty" label="Cantidad" initialValue={1}
                        tooltip="Cuántas unidades de esta herramienta tenés.">
                        <InputNumber min={0} step={1} style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="asset_status" label="Estado" initialValue="activa">
                        <Select size="large" options={[
                          { value: "activa",        label: "Activa" },
                          { value: "en_reparacion", label: "En reparación" },
                          { value: "baja",          label: "Baja" },
                        ]} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="serial_number" label="Número de serie (opcional)">
                    <Input placeholder="SN-12345..." size="large" prefix={<ToolOutlined style={{ color: "#94a3b8" }} />} />
                  </Form.Item>
                  {isAdmin && (
                    <Form.Item name="purchase_total" label="Precio de compra (opcional)"
                      tooltip="Total pagado. Se registra automáticamente como gasto operativo.">
                      <InputNumber min={0} step={100} prefix="$" style={{ width: "100%" }} size="large" placeholder="0.00" />
                    </Form.Item>
                  )}
                </>
              );
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal Solicitud de compra ──────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingOutlined style={{ color: "#d46b08" }} />
            <span>Solicitar compra — {purchaseReqModal.product?.name}</span>
          </div>
        }
        open={purchaseReqModal.open}
        onCancel={() => { setPurchaseReqModal({ open: false, product: null }); purchaseReqForm.resetFields(); }}
        onOk={submitPurchaseRequest}
        confirmLoading={savingPurchaseReq}
        okText="Enviar solicitud"
        okButtonProps={{ style: { background: "#d46b08", borderColor: "#d46b08" } }}
        cancelText="Cancelar"
        width={420}
        destroyOnClose
      >
        <div style={{ background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#d46b08" }}>
            Stock actual: <strong>{Number(purchaseReqModal.product?.available_qty ?? purchaseReqModal.product?.stock_qty ?? 0).toLocaleString("es-AR")} {purchaseReqModal.product?.unit}</strong>
            {purchaseReqModal.product?.stock_bajo && " — ⚠ bajo el mínimo"}
          </Text>
        </div>
        <Form form={purchaseReqForm} layout="vertical">
          <Form.Item
            name="quantity_requested"
            label="Cantidad a comprar"
            rules={[{ required: true, message: "Ingresá la cantidad" }]}
          >
            <InputNumber
              min={0.01} step={1}
              style={{ width: "100%" }} size="large"
              addonAfter={purchaseReqModal.product?.unit}
              placeholder="0"
            />
          </Form.Item>
          <Form.Item name="notes" label="Notas para el admin (opcional)">
            <Input.TextArea
              rows={2}
              placeholder="Ej: Para OT-0055, necesitamos para el viernes..."
              maxLength={255}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal Recibir pedido (admin) ────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            <span>Recibir pedido — {receiveReqModal.req?.product_name}</span>
          </div>
        }
        open={receiveReqModal.open}
        onCancel={() => { setReceiveReqModal({ open: false, req: null }); receiveReqForm.resetFields(); setReqQtyVal(null); setReqTotalVal(null); }}
        onOk={submitReceiveReq}
        confirmLoading={savingReceiveReq}
        okText="Confirmar recepción"
        okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
        cancelText="Cancelar"
        width={420}
        destroyOnClose
      >
        <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#237804" }}>
            Solicitado: <strong>{receiveReqModal.req?.quantity_requested} {receiveReqModal.req?.product_unit}</strong>
            {receiveReqModal.req?.notes && ` · "${receiveReqModal.req.notes}"`}
          </Text>
        </div>
        <Form form={receiveReqForm} layout="vertical">
          <Form.Item
            name="quantity_received"
            label="Cantidad recibida"
            rules={[{ required: true, message: "Ingresá la cantidad" }]}
          >
            <InputNumber
              min={0.01} step={0.5}
              style={{ width: "100%" }} size="large"
              addonAfter={receiveReqModal.req?.product_unit}
              onChange={(v) => setReqQtyVal(v as number | null)}
            />
          </Form.Item>
          <Form.Item
            name="purchase_total"
            label="Precio total pagado (factura)"
            tooltip="Total de lo que pagaste. El sistema calcula el precio por unidad automáticamente."
          >
            <InputNumber
              min={0} step={100} prefix="$"
              style={{ width: "100%" }} size="large"
              placeholder="0.00 (opcional)"
              onChange={(v) => setReqTotalVal(v as number | null)}
            />
          </Form.Item>
          {reqQtyVal && reqTotalVal && reqQtyVal > 0 && (
            <div style={{ marginTop: -12, marginBottom: 16, padding: "6px 12px", background: "#f0f9ff", borderRadius: 6, border: "1px solid #bae0ff" }}>
              <Text style={{ fontSize: 12, color: "#0958d9" }}>
                = <strong>${(reqTotalVal / reqQtyVal).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong> por {receiveReqModal.req?.product_unit} · precio promedio se actualizará automáticamente
              </Text>
            </div>
          )}
        </Form>
      </Modal>

      {/* ── Modal Recibir stock ────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <InboxOutlined style={{ color: "#1677ff" }} />
            <span>Recibir stock — {receiveModal.product?.name}</span>
          </div>
        }
        open={receiveModal.open}
        onCancel={() => { setReceiveModal({ open: false, product: null }); receiveForm.resetFields(); }}
        onOk={receiveStock}
        confirmLoading={savingReceive}
        okText="Registrar ingreso"
        okButtonProps={{ style: { background: "#1677ff" } }}
        cancelText="Cancelar"
        width={420}
        destroyOnClose
      >
        <Form form={receiveForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="qty"
            label="Cantidad a ingresar"
            rules={[
              { required: true, message: "Ingresá la cantidad" },
              { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
            ]}
          >
            <InputNumber
              min={0.01} step={0.5}
              style={{ width: "100%" }} size="large"
              addonAfter={receiveModal.product?.unit}
              placeholder="0"
              onChange={(v) => setRecvQtyVal(v as number | null)}
            />
          </Form.Item>

          <Form.Item name="reason" label="Motivo / referencia" initialValue="Ingreso de stock">
            <Input placeholder="Ej: Compra #234, Devolución de proveedor..." size="large" />
          </Form.Item>

          {isAdmin && (
            <>
              <Form.Item
                name="purchase_total"
                label={receiveModal.product?.kind === "material"
                  ? "Precio total pagado (factura)"
                  : "Costo total gastado (opcional)"}
                tooltip={receiveModal.product?.kind === "material"
                  ? "Total que pagaste por el lote. El sistema calcula el precio por unidad y actualiza el costo promedio."
                  : "Total que gastaste. Se registra automáticamente como gasto operativo."}
              >
                <InputNumber
                  min={0} step={100} prefix="$"
                  style={{ width: "100%" }} size="large"
                  placeholder="0.00 (opcional)"
                  onChange={(v) => setRecvTotalVal(v as number | null)}
                />
              </Form.Item>
              {receiveModal.product?.kind === "material" && recvQtyVal && recvTotalVal && recvQtyVal > 0 && (
                <div style={{ marginTop: -12, marginBottom: 16, padding: "6px 12px", background: "#f0f9ff", borderRadius: 6, border: "1px solid #bae0ff" }}>
                  <Text style={{ fontSize: 12, color: "#0958d9" }}>
                    = <strong>${(recvTotalVal / recvQtyVal).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong> por {receiveModal.product?.unit}
                  </Text>
                </div>
              )}
              {receiveModal.product?.kind !== "material" && recvTotalVal && recvTotalVal > 0 && (
                <div style={{ marginTop: -12, marginBottom: 16, padding: "6px 12px", background: "#fff7ed", borderRadius: 6, border: "1px solid #fed7aa" }}>
                  <Text style={{ fontSize: 12, color: "#c2410c" }}>
                    Se generará un gasto de <strong>${recvTotalVal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong> automáticamente
                  </Text>
                </div>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* ── Modal Rechazo ──────────────────────────────────────────── */}
      <Modal
        title="Rechazar reserva"
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, id: null }); setRejectReason(""); }}
        onOk={rejectReservation}
        confirmLoading={actionLoading !== null}
        okText="Confirmar rechazo" okButtonProps={{ danger: true }}
        cancelText="Cancelar"
      >
        <div style={{ paddingTop: 8 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Podés dejar un motivo para que el sector sepa qué pasó (opcional).
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Ej: Stock insuficiente, usar material alternativo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={255}
            showCount
          />
        </div>
      </Modal>
    </div>
  );
}
