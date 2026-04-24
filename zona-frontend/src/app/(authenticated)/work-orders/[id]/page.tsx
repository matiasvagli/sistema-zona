"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useList, useGetIdentity } from "@refinedev/core";
import {
  Typography, Card, Spin, notification, Modal, Row, Col, Select, Input, InputNumber, Button, DatePicker
} from "antd";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";
import "dayjs/locale/es";

// Componentes extraídos
import { WorkOrderHeader } from "@/components/work-orders/WorkOrderHeader";
import { WorkOrderInfoCard } from "@/components/work-orders/WorkOrderInfoCard";
import { WorkOrderSectors } from "@/components/work-orders/WorkOrderSectors";
import { WorkOrderMaterials } from "@/components/work-orders/WorkOrderMaterials";
import { WorkOrderPhotos } from "@/components/work-orders/WorkOrderPhotos";
import { BillingModal } from "@/components/billing/BillingModal";

dayjs.locale("es");

const { Option } = Select;
import { API_URL as API } from "@/config/api";
import { OT_STATUS, TASK_STATUS } from "@/constants/statuses";

const statusConfig = OT_STATUS;
const taskStatusConfig = TASK_STATUS;

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: identity } = useGetIdentity<any>();
  const [ot, setOt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<any>({});

  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [sectorToAdd, setSectorToAdd] = useState<number | null>(null);
  const [addingTask, setAddingTask] = useState(false);

  const [estimateModal, setEstimateModal] = useState<{ open: boolean; taskId: number | null }>({ open: false, taskId: null });
  const [estimateDate, setEstimateDate] = useState<any>(null);

  const [approvedReservations, setApprovedReservations] = useState<any[]>([]);

  const [matModal, setMatModal] = useState(false);
  const [matSectorTask, setMatSectorTask] = useState<number | null>(null);
  const [matProduct, setMatProduct] = useState<number | null>(null);
  const [matQty, setMatQty] = useState<number>(1);
  const [matNotes, setMatNotes] = useState("");
  const [savingMat, setSavingMat] = useState(false);

  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef  = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<"before" | "after" | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);

  const { result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
  });
  const { result: productsResult } = useList({ resource: "products", pagination: { pageSize: 200 } });
  
  const allSectors: any[] = sectorsResult?.data || [];
  const allProducts: any[] = productsResult?.data || [];

  const fetchOT = async () => {
    try {
      const { data } = await axiosInstance.get(`${API}/work-orders/${id}/`);
      setOt(data);
      setEditFields({
        title: data.title,
        status: data.status,
        priority: data.priority,
        notes: data.notes,
        due_date: data.due_date ? dayjs(data.due_date) : null,
      });
    } catch {
      notification.error({ message: "No se pudo cargar la OT" });
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReservations = async () => {
    try {
      const { data } = await axiosInstance.get(`${API}/material-reservations/?work_order=${id}&status=aprobada`);
      setApprovedReservations(Array.isArray(data) ? data : (data.results ?? []));
    } catch { /* silently fail */ }
  };

  useEffect(() => { fetchOT(); fetchApprovedReservations(); }, [id]);

  const saveHeader = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`${API}/work-orders/${id}/`, {
        title: editFields.title,
        status: editFields.status,
        priority: editFields.priority,
        notes: editFields.notes,
        due_date: editFields.due_date ? dayjs(editFields.due_date).toISOString() : null,
      });
      notification.success({ message: "OT actualizada" });
      setEditMode(false);
      fetchOT();
    } catch {
      notification.error({ message: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const addSector = async () => {
    if (!sectorToAdd) return;
    setAddingTask(true);
    try {
      await axiosInstance.post(`${API}/sector-tasks/`, {
        work_order: Number(id),
        sector: sectorToAdd,
        status: "pendiente",
      });
      notification.success({ message: "Sector agregado" });
      setAddSectorOpen(false);
      setSectorToAdd(null);
      fetchOT();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al agregar sector" });
    } finally {
      setAddingTask(false);
    }
  };

  const removeSector = async (taskId: number) => {
    try {
      await axiosInstance.delete(`${API}/sector-tasks/${taskId}/`);
      notification.success({ message: "Sector eliminado" });
      fetchOT();
    } catch {
      notification.error({ message: "Error al eliminar sector" });
    }
  };

  const changeTaskStatus = async (taskId: number, action: "start" | "complete" | "block") => {
    try {
      await axiosInstance.post(`${API}/sector-tasks/${taskId}/${action}/`);
      fetchOT();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "No se pudo cambiar el estado" });
    }
  };

  const saveEstimate = async () => {
    if (!estimateModal.taskId || !estimateDate) return;
    try {
      await axiosInstance.post(`${API}/sector-tasks/${estimateModal.taskId}/set-estimate/`, {
        estimated_finish: dayjs(estimateDate).toISOString(),
      });
      notification.success({ message: "Fecha estimada guardada" });
      setEstimateModal({ open: false, taskId: null });
      setEstimateDate(null);
      fetchOT();
    } catch {
      notification.error({ message: "Error al guardar fecha" });
    }
  };

  const addMaterial = async () => {
    if (!matSectorTask || !matProduct || !matQty) return;
    setSavingMat(true);
    try {
      const { data: reservation } = await axiosInstance.post(`${API}/material-reservations/`, {
        sector_task: matSectorTask, product: matProduct, quantity: matQty, notes: matNotes,
      });
      // Si es admin, aprobar directamente
      if (identity?.is_staff || identity?.rol === 'admin' || identity?.rol === 'ceo') {
        await axiosInstance.post(`${API}/material-reservations/${reservation.id}/approve/`);
      }
      notification.success({ message: identity?.is_staff || identity?.rol === 'admin' || identity?.rol === 'ceo' ? "Material asignado y aprobado" : "Solicitud enviada para aprobación" });
      setMatModal(false); setMatSectorTask(null); setMatProduct(null); setMatQty(1); setMatNotes("");
      fetchApprovedReservations();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al asignar material" });
    } finally { setSavingMat(false); }
  };

  const uploadPhoto = async (file: File, category: "before" | "after") => {
    setUploadingPhoto(category);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      await axiosInstance.post(`${API}/work-orders/${id}/upload-photo/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notification.success({ message: "Foto subida" });
      fetchOT();
    } catch { notification.error({ message: "Error al subir la foto" }); }
    finally { setUploadingPhoto(null); }
  };

  const removePhoto = async (url: string, category: "before" | "after", photoId?: number) => {
    try {
      await axiosInstance.post(`${API}/work-orders/${id}/remove-photo/`, { url, category, id: photoId });
      fetchOT();
    } catch { notification.error({ message: "Error al eliminar foto" }); }
  };

  const handleInvoiceOT = async () => {
    setBillingOpen(true);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  if (!ot) return null;

  const tasks: any[] = ot.tasks || [];
  const assignedSectorIds = tasks.map((t: any) => t.sector);
  const availableSectors = allSectors.filter((s) => !assignedSectorIds.includes(s.id));
  const statusCfg = statusConfig[ot.status as keyof typeof statusConfig] ?? { color: "default", label: ot.status };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>
      
      <WorkOrderHeader
        ot={ot}
        editMode={editMode}
        setEditMode={setEditMode}
        editFields={editFields}
        setEditFields={setEditFields}
        saveHeader={saveHeader}
        saving={saving}
        handleInvoice={handleInvoiceOT}
        canEdit={identity?.is_staff || identity?.rol === 'ceo' || identity?.rol === 'admin'}
      />

      <div style={{ padding: "0 12px", marginTop: -60 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            
            <WorkOrderInfoCard 
              ot={ot}
              editMode={editMode}
              setEditMode={setEditMode}
              editFields={editFields}
              setEditFields={setEditFields}
              statusCfg={statusCfg}
            />

            <WorkOrderSectors
              tasks={tasks}
              availableSectors={availableSectors}
              setAddSectorOpen={setAddSectorOpen}
              changeTaskStatus={changeTaskStatus}
              removeSector={removeSector}
              setEstimateModal={setEstimateModal}
              setEstimateDate={setEstimateDate}
              taskStatusConfig={taskStatusConfig}
              canEditSector={(sectorId: number) => {
                const isAdminOrCeo = identity?.is_staff || identity?.rol === 'ceo' || identity?.rol === 'admin';
                if (isAdminOrCeo) return true;
                const memberships: any[] = identity?.sector_memberships || [];
                if (memberships.length > 0) return memberships.some((m: any) => m.sector === sectorId && m.puede_editar);
                return identity?.sector === sectorId;
              }}
            />

            <WorkOrderMaterials
              materials={approvedReservations}
              setMatModal={setMatModal}
              canAdd={!!(identity?.is_staff || identity?.rol === 'admin' || identity?.rol === 'ceo')}
            />

          </Col>

          <Col xs={24} lg={10}>
            <WorkOrderPhotos 
              ot={ot}
              uploadPhoto={uploadPhoto}
              removePhoto={removePhoto}
              uploadingPhoto={uploadingPhoto}
              fileBeforeRef={fileBeforeRef}
              fileAfterRef={fileAfterRef}
            />
          </Col>
        </Row>
      </div>

      {/* MODALS */}
      <Modal
        title="Agregar Sector de Producción"
        open={addSectorOpen}
        onOk={addSector}
        onCancel={() => setAddSectorOpen(false)}
        confirmLoading={addingTask}
        okText="Agregar"
        cancelText="Cancelar"
      >
        <div style={{ padding: "10px 0" }}>
          <p style={{ marginBottom: 8 }}>Selecciona el sector que deseas añadir:</p>
          <Select
            placeholder="Seleccionar sector"
            style={{ width: "100%" }}
            onChange={setSectorToAdd}
            value={sectorToAdd}
          >
            {availableSectors.map((s) => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* El resto de los modales (materiales, fecha estimada) podrían extraerse también pero por ahora los dejamos aquí para no extender el refactor */}
      {/* TODO: Extraer estos modales a sus propios componentes */}
      
      <Modal
        title="Establecer Fecha Estimada de Finalización"
        open={estimateModal.open}
        onOk={saveEstimate}
        onCancel={() => setEstimateModal({ open: false, taskId: null })}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <div style={{ padding: "10px 0" }}>
          <p style={{ marginBottom: 8 }}>Selecciona la fecha y hora estimada:</p>
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: "100%" }}
            onChange={(d) => setEstimateDate(d)}
            value={estimateDate}
          />
        </div>
      </Modal>

      <Modal
        title="Asignar Material"
        open={matModal}
        onOk={addMaterial}
        onCancel={() => { setMatModal(false); setMatSectorTask(null); setMatProduct(null); setMatQty(1); setMatNotes(""); }}
        confirmLoading={savingMat}
        okText="Asignar"
        cancelText="Cancelar"
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "10px 0" }}>
          <div>
            <p style={{ marginBottom: 6 }}>Sector:</p>
            <Select
              placeholder="Seleccionar sector..."
              style={{ width: "100%" }}
              onChange={setMatSectorTask}
              value={matSectorTask}
            >
              {(ot?.tasks || []).map((t: any) => (
                <Option key={t.id} value={t.id}>{t.sector_name}</Option>
              ))}
            </Select>
          </div>
          <div>
            <p style={{ marginBottom: 6 }}>Producto:</p>
            <Select
              showSearch
              placeholder="Buscar producto..."
              style={{ width: "100%" }}
              optionFilterProp="children"
              onChange={setMatProduct}
              value={matProduct}
            >
              {allProducts.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} ({p.unit}) - Stock: {p.stock_qty}</Option>
              ))}
            </Select>
          </div>
          <div>
            <p style={{ marginBottom: 6 }}>Cantidad:</p>
            <InputNumber min={0.01} style={{ width: "100%" }} value={matQty} onChange={(v) => setMatQty(v || 1)} />
          </div>
          <div>
            <p style={{ marginBottom: 6 }}>Notas / Medidas:</p>
            <Input placeholder="Ej: 2.5 mts" value={matNotes} onChange={(e) => setMatNotes(e.target.value)} />
          </div>
        </div>
      </Modal>
      
      <BillingModal 
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        onSuccess={fetchOT}
        budgetId={ot.budget}
        workOrderId={ot.id}
        clientId={ot.client}
        clientName={ot.client_name}
        totalAmount={ot.total_amount || 0}
      />

    </div>
  );
}
