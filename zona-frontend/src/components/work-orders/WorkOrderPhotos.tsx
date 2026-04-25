"use client";

import React from "react";
import { Typography, Button, Empty, Row, Col, Image, Popconfirm, Spin } from "antd";
import { CameraOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface WorkOrderPhotosProps {
  ot: any;
  uploadPhoto: (file: File, category: "before" | "after") => void;
  removePhoto: (url: string, category: "before" | "after", id?: number) => void;
  uploadingPhoto: "before" | "after" | null;
  fileBeforeRef: React.RefObject<HTMLInputElement>;
  fileAfterRef: React.RefObject<HTMLInputElement>;
}

export const WorkOrderPhotos: React.FC<WorkOrderPhotosProps> = ({
  ot,
  uploadPhoto,
  removePhoto,
  uploadingPhoto,
  fileBeforeRef,
  fileAfterRef,
}) => {
  const photosBefore: { url: string; id: number }[] =
    ot.new_photos?.filter((p: any) => p.category === "before").map((p: any) => ({ url: p.image, id: p.id })) || [];

  const photosAfter: { url: string; id: number }[] =
    ot.new_photos?.filter((p: any) => p.category === "after").map((p: any) => ({ url: p.image, id: p.id })) || [];

  const renderPhotoSection = (title: string, photos: any[], category: "before" | "after", ref: React.RefObject<HTMLInputElement>) => (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "24px 28px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
            <CameraOutlined />
          </div>
          <Text strong style={{ fontSize: 16 }}>{title}</Text>
        </div>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={ref}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file, category);
          }}
        />
        <Button
          type="primary"
          ghost
          icon={<UploadOutlined />}
          onClick={() => ref.current?.click()}
          loading={uploadingPhoto === category}
          style={{ borderRadius: 8 }}
        >
          Subir Foto
        </Button>
      </div>

      {photos.length === 0 ? (
        <Empty description="No hay fotos en esta categoría" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[12, 12]}>
          {photos.map((p, i) => {
            const { url, id } = p;
            return (
              <Col key={i} xs={12} sm={8} md={6}>
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                  <Image
                    src={url}
                    alt="Foto de trabajo"
                    style={{ width: "100%", height: 120, objectFit: "cover" }}
                  />
                  <Popconfirm
                    title="¿Eliminar esta foto?"
                    onConfirm={() => removePhoto(url, category, id)}
                    okText="Sí"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      style={{ position: "absolute", top: 8, right: 8, borderRadius: 6, width: 28, height: 28 }}
                    />
                  </Popconfirm>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );

  return (
    <>
      {renderPhotoSection("Fotos de Diseño / Antes", photosBefore, "before", fileBeforeRef)}
      {renderPhotoSection("Fotos de Trabajo Terminado", photosAfter, "after", fileAfterRef)}
    </>
  );
};
