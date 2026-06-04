import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Box,
  Briefcase,
  Building2,
  Cpu,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FilePlus2,
  GitBranch,
  GripVertical,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Megaphone,
  MessageSquare,
  MousePointer2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { diagramService } from '../services/api';
import { useUsers } from '../hooks/useUsers';

type OrgUser = { email: string; name: string; role: string; picture?: string; manager_email?: string };
type NodeKind = 'ceo' | 'department' | 'person' | 'website' | 'app' | 'system' | 'database' | 'process' | 'note' | 'external' | 'marketing-channel';
type ConnectorKind = 'straight' | 'elbow' | 'curved';
type ArrowKind = 'none' | 'one-way' | 'two-way';
type ConnectorRouteMode = 'auto' | 'horizontal' | 'vertical';

type DiagramNode = {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle: string;
  detail?: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  teams: string[];
  linkUrl?: string;
  drillPageId?: string;
};

type Connector = { id: string; from: string; to: string; kind: ConnectorKind; arrow: ArrowKind; label?: string; forwardLabel?: string; backwardLabel?: string; detail?: string; forwardDetail?: string; backwardDetail?: string; routeMode?: ConnectorRouteMode; bend?: number };
type DiagramData = { nodes: DiagramNode[]; connectors: Connector[]; assignments: Record<string, string[]>; memberAssignments?: Record<string, string[]>; lockedGroups?: string[][]; lockedNodeIds?: string[]; coordinateMode?: 'center-cartesian' | 'first-node-center' };
type DiagramPage = { id: string; title: string; description: string; sort_order: number; data: DiagramData; created_at?: string; updated_at?: string };

const STORAGE_KEY = 'skymobile.diagram-editor.pages.v2';
const MIN_CANVAS_SIZE = { width: 3200, height: 2400 };
const CANVAS_PADDING = 1200;

const defaultNodes: DiagramNode[] = [
  { id: 'ceo', kind: 'ceo', title: 'GIÁM ĐỐC / CEO', subtitle: 'Ban Điều Hành', color: 'slate', x: 760, y: 80, w: 270, h: 100, teams: [] },
  { id: 'sales-mkt', kind: 'department', title: 'PHÒNG KD – MKT', subtitle: 'Marketing, Sale, CSKH', color: 'blue', x: 120, y: 320, w: 240, h: 190, teams: ['Ads', 'Sale', 'CSKH'] },
  { id: 'comms-dept', kind: 'department', title: 'PHÒNG TRUYỀN THÔNG', subtitle: 'Content, media, thương hiệu', color: 'amber', x: 420, y: 320, w: 240, h: 190, teams: ['Content', 'Media', 'Brand'] },
  { id: 'hr-dept', kind: 'department', title: 'HCNS', subtitle: 'Tuyển dụng, đào tạo, hành chính', color: 'emerald', x: 720, y: 320, w: 240, h: 190, teams: ['Tuyển dụng', 'Đào tạo', 'Hành chính'] },
  { id: 'finance-dept', kind: 'department', title: 'TÀI CHÍNH – KẾ TOÁN', subtitle: 'Dòng tiền, công nợ, báo cáo', color: 'rose', x: 1020, y: 320, w: 240, h: 190, teams: ['Doanh thu', 'Chi phí', 'Công nợ'] },
  { id: 'technical', kind: 'department', title: 'KỸ THUẬT – VẬN HÀNH', subtitle: 'SIM, WiFi, hỗ trợ kỹ thuật', color: 'indigo', x: 1320, y: 320, w: 240, h: 190, teams: ['SIM', 'Pocket WiFi', 'Support'] },
  { id: 'website-main', kind: 'website', title: 'WEBSITE', subtitle: 'Landing page / bán hàng', color: 'indigo', x: 180, y: 650, w: 220, h: 135, teams: [], linkUrl: 'https://skymobile.movads.vn' },
  { id: 'app-cskh', kind: 'app', title: 'APP / CRM', subtitle: 'Quản lý khách hàng & CSKH', color: 'emerald', x: 470, y: 650, w: 220, h: 135, teams: [] },
  { id: 'db-customer', kind: 'database', title: 'DATABASE', subtitle: 'Khách hàng, đơn hàng, nhân sự', color: 'rose', x: 760, y: 650, w: 220, h: 135, teams: [] },
];

const defaultConnectors: Connector[] = [
  ...defaultNodes.filter(n => n.kind === 'department').map(n => ({ id: `ceo-${n.id}`, from: 'ceo', to: n.id, kind: 'elbow' as ConnectorKind, arrow: 'one-way' as ArrowKind, label: '' })),
  { id: 'sales-website', from: 'sales-mkt', to: 'website-main', kind: 'elbow', arrow: 'two-way', label: '', forwardLabel: 'brief nội dung', backwardLabel: 'lead / form' },
  { id: 'website-app', from: 'website-main', to: 'app-cskh', kind: 'straight', arrow: 'one-way', label: 'form/inbox' },
  { id: 'app-db', from: 'app-cskh', to: 'db-customer', kind: 'straight', arrow: 'one-way', label: 'lưu dữ liệu' },
];

const createAssignments = (nodes: DiagramNode[]) => Object.fromEntries(nodes.filter(n => n.kind === 'department').map(n => [n.id, []])) as Record<string, string[]>;
const toFirstNodeCenteredCoordinates = (nodes: DiagramNode[], coordinateMode?: DiagramData['coordinateMode']): DiagramNode[] => {
  if (!nodes.length) return [];
  if (coordinateMode === 'first-node-center') return nodes;

  const centerNodes = coordinateMode === 'center-cartesian'
    ? nodes
    : nodes.map(node => ({ ...node, x: node.x + node.w / 2, y: -(node.y + node.h / 2) }));
  const origin = { x: centerNodes[0].x, y: centerNodes[0].y };
  return centerNodes.map(node => ({
    ...node,
    x: Math.round(node.x - origin.x),
    y: Math.round(node.y - origin.y),
  }));
};
const normalizeDiagramData = (data: Partial<DiagramData> = {}): DiagramData => {
  const nodes = toFirstNodeCenteredCoordinates(data.nodes || [], data.coordinateMode);
  return {
    nodes,
    connectors: data.connectors || [],
    assignments: data.assignments || {},
    memberAssignments: data.memberAssignments || {},
    lockedGroups: data.lockedGroups || [],
    lockedNodeIds: data.lockedNodeIds || [],
    coordinateMode: 'first-node-center',
  };
};
const createDefaultData = (): DiagramData => normalizeDiagramData({ nodes: defaultNodes, connectors: defaultConnectors, assignments: createAssignments(defaultNodes), memberAssignments: {}, lockedGroups: [], lockedNodeIds: [] });
const createSalesFlowData = (): DiagramData => normalizeDiagramData({
  nodes: [
    { id: 'ads-facebook', kind: 'marketing-channel', title: 'QUẢNG CÁO FANPAGE FACEBOOK', subtitle: 'Nguồn lead chính hiện tại: Ads, bài viết, form, inbox', detail: 'Chạy quảng cáo Fanpage Facebook để tìm kiếm khách hàng mới. Lead phát sinh từ inbox Messenger, form, bình luận hoặc chiến dịch remarketing.', color: 'blue', x: -720, y: 240, w: 260, h: 145, teams: [] },
    { id: 'google-search-ads', kind: 'marketing-channel', title: 'GOOGLE TÌM KIẾM', subtitle: 'Bổ sung quảng cáo theo nhu cầu tìm kiếm', detail: 'Triển khai Google Search Ads cho nhóm khách hàng chủ động tìm dịch vụ. Tối ưu từ khoá, landing page và đo chuyển đổi.', color: 'indigo', x: -720, y: 0, w: 260, h: 145, teams: [] },
    { id: 'affiliate-channel', kind: 'marketing-channel', title: 'AFFILIATE / CỘNG TÁC VIÊN', subtitle: 'Bổ sung nguồn lead qua đối tác giới thiệu', detail: 'Phát triển kênh affiliate/cộng tác viên để mở rộng tệp khách hàng. Cần cơ chế tracking lead, hoa hồng và đối soát.', color: 'emerald', x: -720, y: -240, w: 260, h: 145, teams: [] },
    { id: 'app-android-ios', kind: 'app', title: 'APP ANDROID / iOS', subtitle: 'Khách hàng tự đăng ký dịch vụ qua App', detail: 'Kênh tương lai: triển khai App Android/iOS để khách hàng đăng ký dịch vụ, theo dõi thông tin và nhận truyền thông từ App.', color: 'emerald', x: -720, y: -480, w: 260, h: 145, teams: [] },
    { id: 'lead-inbox-form', kind: 'process', title: 'TIẾP NHẬN LEAD', subtitle: 'Messenger, form, điện thoại, App, affiliate', detail: 'Tập trung lead từ các nguồn về một điểm xử lý: Facebook Messenger, form quảng cáo, cuộc gọi, đăng ký trên App, Google Ads và affiliate.', color: 'amber', x: -360, y: 0, w: 260, h: 170, teams: [] },
    { id: 'sale-cskh-messenger', kind: 'department', title: 'SALE / CSKH QUA MESSENGER', subtitle: 'Tư vấn, phản hồi inbox, chốt nhu cầu', detail: 'Đội Sale/CSKH phản hồi khách qua Messenger: xác nhận nhu cầu, tư vấn dịch vụ, gửi bảng giá/chính sách, tạo hồ sơ khách hàng.', color: 'blue', x: 0, y: 160, w: 280, h: 170, teams: ['Messenger', 'CSKH', 'Tư vấn'] },
    { id: 'telesale-followup', kind: 'department', title: 'TELESALE FOLLOW-UP', subtitle: 'Gọi tư vấn, xác nhận thông tin, thúc đẩy chốt đơn', detail: 'Telesale gọi lại khách hàng tiềm năng để xác nhận nhu cầu, giải đáp vướng mắc, nhắc thanh toán và chăm sóc trước/sau bán.', color: 'emerald', x: 0, y: -160, w: 280, h: 170, teams: ['Telesale', 'Chăm sóc'] },
    { id: 'qualify-customer', kind: 'process', title: 'PHÂN LOẠI & XÁC NHẬN NHU CẦU', subtitle: 'Dịch vụ, quốc gia, thời gian, ngân sách', detail: 'Phân loại khách theo nhu cầu dịch vụ, mức độ tiềm năng, thời điểm sử dụng, quốc gia/khu vực, ngân sách và trạng thái xử lý.', color: 'amber', x: 360, y: 0, w: 280, h: 165, teams: [] },
    { id: 'quote-order', kind: 'process', title: 'BÁO GIÁ / TẠO ĐƠN', subtitle: 'Chốt gói dịch vụ và tạo đơn hàng', detail: 'Gửi báo giá, xác nhận gói dịch vụ, số lượng, thời gian sử dụng, địa chỉ giao nhận và tạo đơn trên hệ thống CRM/App.', color: 'rose', x: 720, y: 0, w: 270, h: 165, teams: [] },
    { id: 'payment-confirm', kind: 'process', title: 'THANH TOÁN / XÁC NHẬN', subtitle: 'Đối soát thanh toán, xác nhận đơn', detail: 'Theo dõi thanh toán, xác nhận đơn hàng, cập nhật công nợ/trạng thái thanh toán và chuyển thông tin sang vận hành.', color: 'rose', x: 1060, y: 0, w: 260, h: 155, teams: [] },
    { id: 'fulfillment-service', kind: 'process', title: 'KÍCH HOẠT / GIAO DỊCH VỤ', subtitle: 'SIM, WiFi, gói dịch vụ, hỗ trợ kỹ thuật', detail: 'Vận hành xử lý giao/ kích hoạt dịch vụ, phối hợp kỹ thuật và cập nhật trạng thái cho khách hàng.', color: 'indigo', x: 1400, y: 0, w: 270, h: 165, teams: [] },
    { id: 'after-sale-cskh', kind: 'department', title: 'CSKH SAU BÁN', subtitle: 'Hỗ trợ, nhắc gia hạn, upsell/cross-sell', detail: 'Chăm sóc sau bán: hỗ trợ sử dụng, xử lý sự cố, nhắc gia hạn, xin phản hồi và khai thác cơ hội upsell/cross-sell.', color: 'blue', x: 1740, y: 0, w: 270, h: 165, teams: ['CSKH', 'Gia hạn'] },
  ],
  connectors: [
    { id: 'fb-to-lead', from: 'ads-facebook', to: 'lead-inbox-form', kind: 'elbow', arrow: 'one-way', label: 'lead / inbox' },
    { id: 'google-to-lead', from: 'google-search-ads', to: 'lead-inbox-form', kind: 'straight', arrow: 'one-way', label: 'lead tìm kiếm' },
    { id: 'affiliate-to-lead', from: 'affiliate-channel', to: 'lead-inbox-form', kind: 'elbow', arrow: 'one-way', label: 'giới thiệu' },
    { id: 'app-to-lead', from: 'app-android-ios', to: 'lead-inbox-form', kind: 'elbow', arrow: 'one-way', label: 'đăng ký App' },
    { id: 'lead-to-messenger', from: 'lead-inbox-form', to: 'sale-cskh-messenger', kind: 'elbow', arrow: 'one-way', label: 'phân tuyến' },
    { id: 'lead-to-telesale', from: 'lead-inbox-form', to: 'telesale-followup', kind: 'elbow', arrow: 'one-way', label: 'gọi lại' },
    { id: 'messenger-to-qualify', from: 'sale-cskh-messenger', to: 'qualify-customer', kind: 'elbow', arrow: 'one-way', label: 'thông tin nhu cầu' },
    { id: 'telesale-to-qualify', from: 'telesale-followup', to: 'qualify-customer', kind: 'elbow', arrow: 'one-way', label: 'xác nhận' },
    { id: 'qualify-to-quote', from: 'qualify-customer', to: 'quote-order', kind: 'straight', arrow: 'one-way', label: 'đủ điều kiện' },
    { id: 'quote-to-payment', from: 'quote-order', to: 'payment-confirm', kind: 'straight', arrow: 'one-way', label: 'chốt đơn' },
    { id: 'payment-to-fulfillment', from: 'payment-confirm', to: 'fulfillment-service', kind: 'straight', arrow: 'one-way', label: 'xử lý đơn' },
    { id: 'fulfillment-to-after-sale', from: 'fulfillment-service', to: 'after-sale-cskh', kind: 'straight', arrow: 'one-way', label: 'bàn giao CSKH' },
    { id: 'after-sale-to-quote', from: 'after-sale-cskh', to: 'quote-order', kind: 'curved', arrow: 'one-way', label: 'gia hạn / mua thêm', bend: -90 },
  ],
  assignments: {},
  memberAssignments: {},
  lockedGroups: [],
  lockedNodeIds: [],
});

const createWebsiteAppData = (): DiagramData => normalizeDiagramData({
  nodes: [
    { id: 'website-company', kind: 'website', title: 'WEBSITE CÔNG TY', subtitle: 'Trang giới thiệu thương hiệu, dịch vụ, tin tức', detail: 'Website công ty là kênh chính thức: giới thiệu thương hiệu Skymobile, dịch vụ, bảng giá, tin tức, chính sách, thông tin liên hệ và điểm đến SEO dài hạn.', color: 'indigo', x: -520, y: 240, w: 270, h: 160, teams: ['Website', 'SEO', 'Thương hiệu'] },
    { id: 'landing-sales', kind: 'website', title: 'LADIPAGE BÁN HÀNG', subtitle: 'Landing page theo chiến dịch / thị trường', detail: 'Các Ladipage bán hàng phục vụ quảng cáo chuyển đổi: thiết kế theo từng dịch vụ, thị trường, ưu đãi, form đăng ký và đo lường conversion.', color: 'rose', x: -520, y: 0, w: 270, h: 160, teams: ['Landing page', 'Ads', 'Conversion'] },
    { id: 'main-fanpage', kind: 'marketing-channel', title: 'FANPAGE CHÍNH', subtitle: 'Kênh truyền thông, inbox, chăm sóc khách', detail: 'Fanpage chính dùng để xây dựng thương hiệu, đăng nội dung, chạy quảng cáo, tiếp nhận inbox/comment và điều hướng lead sang Sale/CSKH.', color: 'blue', x: -520, y: -240, w: 270, h: 160, teams: ['Facebook', 'Messenger', 'Brand'] },
    { id: 'market-fanpages', kind: 'marketing-channel', title: 'FANPAGE PHỤ THEO THỊ TRƯỜNG', subtitle: 'Fanpage cho từng quốc gia/khu vực/dịch vụ', detail: 'Các Fanpage phụ triển khai theo thị trường hoặc nhóm dịch vụ: nội dung bản địa hoá, quảng cáo riêng, remarketing và tracking hiệu quả từng thị trường.', color: 'blue', x: -520, y: -480, w: 280, h: 170, teams: ['Thị trường', 'Ads', 'Local content'] },
    { id: 'customer-app', kind: 'app', title: 'APP KHÁCH HÀNG ANDROID / iOS', subtitle: 'Đăng ký dịch vụ, theo dõi đơn, nhận truyền thông App', detail: 'App khách hàng trên Android/iOS để đăng ký dịch vụ, quản lý thông tin, theo dõi đơn hàng, nhận thông báo, ưu đãi và chương trình chăm sóc.', color: 'emerald', x: -80, y: 180, w: 300, h: 175, teams: ['Android', 'iOS', 'Khách hàng'] },
    { id: 'employee-app', kind: 'app', title: 'APP NHÂN VIÊN', subtitle: 'Sale/CSKH/vận hành xử lý công việc nội bộ', detail: 'App nhân viên hỗ trợ Sale, CSKH và vận hành: nhận lead, cập nhật trạng thái, ghi chú khách hàng, xử lý đơn, giao việc và theo dõi KPI.', color: 'emerald', x: -80, y: -80, w: 300, h: 175, teams: ['Sale', 'CSKH', 'Vận hành'] },
    { id: 'map-location', kind: 'external', title: 'MAP / ĐỊA ĐIỂM', subtitle: 'Google Map, điểm bán, khu vực phục vụ', detail: 'Map hiển thị điểm bán/điểm hỗ trợ/khu vực phục vụ, hỗ trợ khách tìm địa điểm gần nhất và tăng độ tin cậy khi tìm kiếm trên Google.', color: 'amber', x: -80, y: -340, w: 280, h: 160, teams: ['Google Map', 'Địa điểm'] },
    { id: 'crm-customer-data', kind: 'database', title: 'CRM / DỮ LIỆU KHÁCH HÀNG', subtitle: 'Lưu lead, khách hàng, đơn hàng, lịch sử chăm sóc', detail: 'CRM là trung tâm lưu trữ dữ liệu khách hàng: nguồn lead, lịch sử tư vấn, đơn hàng, thanh toán, chăm sóc sau bán, phân loại thị trường và báo cáo.', color: 'slate', x: 360, y: 0, w: 310, h: 190, teams: ['CRM', 'Data', 'Customer 360'] },
    { id: 'order-payment', kind: 'process', title: 'ĐƠN HÀNG / THANH TOÁN', subtitle: 'Tạo đơn, đối soát thanh toán, trạng thái dịch vụ', detail: 'Module đơn hàng và thanh toán quản lý báo giá, tạo đơn, trạng thái thanh toán, công nợ, đối soát và bàn giao sang vận hành.', color: 'rose', x: 760, y: 160, w: 290, h: 165, teams: ['Order', 'Payment'] },
    { id: 'notification-system', kind: 'system', title: 'THÔNG BÁO / TRUYỀN THÔNG APP', subtitle: 'Push notification, campaign, remarketing', detail: 'Hệ thống thông báo gửi push notification, tin chăm sóc, ưu đãi, nhắc gia hạn, chiến dịch remarketing và truyền thông qua App.', color: 'indigo', x: 760, y: -100, w: 290, h: 165, teams: ['Push', 'Campaign'] },
    { id: 'analytics-dashboard', kind: 'system', title: 'BÁO CÁO / DASHBOARD', subtitle: 'Lead, doanh thu, hiệu quả kênh, KPI', detail: 'Dashboard tổng hợp dữ liệu từ Website, Ladipage, Fanpage, App, CRM để theo dõi lead, doanh thu, tỷ lệ chuyển đổi, hiệu quả thị trường và KPI đội ngũ.', color: 'amber', x: 1160, y: 20, w: 300, h: 175, teams: ['BI', 'KPI', 'Analytics'] },
    { id: 'external-integrations', kind: 'external', title: 'TÍCH HỢP NGOÀI', subtitle: 'Facebook, Google Ads, Zalo, WhatsApp, Line, API', detail: 'Các tích hợp ngoài gồm Facebook/Messenger, Google Ads/Search/Map, Zalo, WhatsApp, Line, cổng thanh toán và API đối tác để đồng bộ lead/dữ liệu.', color: 'slate', x: 360, y: -320, w: 310, h: 175, teams: ['API', 'Ads', 'Messaging'] },
  ],
  connectors: [
    { id: 'company-to-crm', from: 'website-company', to: 'crm-customer-data', kind: 'elbow', arrow: 'one-way', label: 'form / liên hệ' },
    { id: 'landing-to-crm', from: 'landing-sales', to: 'crm-customer-data', kind: 'straight', arrow: 'one-way', label: 'lead đăng ký' },
    { id: 'main-fanpage-to-crm', from: 'main-fanpage', to: 'crm-customer-data', kind: 'elbow', arrow: 'one-way', label: 'inbox / comment' },
    { id: 'market-fanpages-to-crm', from: 'market-fanpages', to: 'crm-customer-data', kind: 'elbow', arrow: 'one-way', label: 'lead thị trường' },
    { id: 'customer-app-to-crm', from: 'customer-app', to: 'crm-customer-data', kind: 'straight', arrow: 'two-way', forwardLabel: 'đăng ký / cập nhật', backwardLabel: 'trạng thái / CSKH' },
    { id: 'employee-app-to-crm', from: 'employee-app', to: 'crm-customer-data', kind: 'straight', arrow: 'two-way', forwardLabel: 'xử lý lead', backwardLabel: 'dữ liệu công việc' },
    { id: 'map-to-website', from: 'map-location', to: 'website-company', kind: 'curved', arrow: 'one-way', label: 'điều hướng khách', bend: -90 },
    { id: 'crm-to-order', from: 'crm-customer-data', to: 'order-payment', kind: 'elbow', arrow: 'one-way', label: 'chốt đơn' },
    { id: 'order-to-customer-app', from: 'order-payment', to: 'customer-app', kind: 'curved', arrow: 'one-way', label: 'trạng thái đơn', bend: -80 },
    { id: 'crm-to-notification', from: 'crm-customer-data', to: 'notification-system', kind: 'elbow', arrow: 'one-way', label: 'phân nhóm khách' },
    { id: 'notification-to-customer-app', from: 'notification-system', to: 'customer-app', kind: 'curved', arrow: 'one-way', label: 'push / ưu đãi', bend: 90 },
    { id: 'integrations-to-crm', from: 'external-integrations', to: 'crm-customer-data', kind: 'straight', arrow: 'two-way', forwardLabel: 'đồng bộ lead', backwardLabel: 'tracking' },
    { id: 'crm-to-dashboard', from: 'crm-customer-data', to: 'analytics-dashboard', kind: 'straight', arrow: 'one-way', label: 'dữ liệu báo cáo' },
    { id: 'order-to-dashboard', from: 'order-payment', to: 'analytics-dashboard', kind: 'elbow', arrow: 'one-way', label: 'doanh thu' },
    { id: 'integrations-to-dashboard', from: 'external-integrations', to: 'analytics-dashboard', kind: 'elbow', arrow: 'one-way', label: 'hiệu quả ads' },
  ],
  assignments: {},
  memberAssignments: {},
  lockedGroups: [],
  lockedNodeIds: [],
});

const createDefaultPages = (): DiagramPage[] => [
  { id: 'company-overview', title: 'Sơ đồ tổng công ty', description: 'Tổng quan tổ chức, hệ thống, website/app và dữ liệu Skymobile.', sort_order: 0, data: createDefaultData() },
  { id: 'sales-flow', title: 'Quy trình Sale', description: 'Mô hình vận hành Sale: nguồn lead Facebook/Google/App/Affiliate, Sale CSKH Messenger, Telesale, chốt đơn và chăm sóc sau bán.', sort_order: 1, data: createSalesFlowData() },
  { id: 'system-map', title: 'Sơ đồ Website/App', description: 'Hệ sinh thái Website công ty, Ladipage bán hàng, Fanpage, App khách hàng/nhân viên, Map, CRM và các tích hợp.', sort_order: 2, data: createWebsiteAppData() },
];

const ensureRequiredDiagramPages = (items: DiagramPage[]): DiagramPage[] => {
  const requiredPages: DiagramPage[] = [
    { id: 'sales-flow', title: 'Quy trình Sale', description: 'Mô hình vận hành Sale: nguồn lead Facebook/Google/App/Affiliate, Sale CSKH Messenger, Telesale, chốt đơn và chăm sóc sau bán.', sort_order: 1, data: createSalesFlowData() },
    { id: 'system-map', title: 'Sơ đồ Website/App', description: 'Hệ sinh thái Website công ty, Ladipage bán hàng, Fanpage, App khách hàng/nhân viên, Map, CRM và các tích hợp.', sort_order: 2, data: createWebsiteAppData() },
  ];

  let next = [...items];
  requiredPages.forEach(requiredPage => {
    const pageIndex = next.findIndex(page => page.id === requiredPage.id);
    if (pageIndex === -1) {
      next = [...next, { ...requiredPage, sort_order: next.length }];
      return;
    }
    const page = next[pageIndex];
    if ((page.data?.nodes || []).length > 0) return;
    next = next.map((item, index) => index === pageIndex ? { ...item, title: item.title || requiredPage.title, description: item.description || requiredPage.description, data: requiredPage.data } : item);
  });
  return next;
};

const colorClass: Record<string, { header: string; soft: string; border: string; dot: string }> = {
  slate: { header: 'bg-slate-900 text-white', soft: 'bg-slate-100 text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
  blue: { header: 'bg-blue-600 text-white', soft: 'bg-blue-50 text-blue-700', border: 'border-blue-300', dot: 'bg-blue-400' },
  amber: { header: 'bg-amber-600 text-white', soft: 'bg-amber-50 text-amber-700', border: 'border-amber-300', dot: 'bg-amber-400' },
  emerald: { header: 'bg-emerald-600 text-white', soft: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-400' },
  rose: { header: 'bg-rose-600 text-white', soft: 'bg-rose-50 text-rose-700', border: 'border-rose-300', dot: 'bg-rose-400' },
  indigo: { header: 'bg-indigo-600 text-white', soft: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-400' },
};

const shapeLibrary: Array<{ kind: NodeKind; title: string; subtitle: string; color: string; icon: React.ReactNode }> = [
  { kind: 'department', title: 'PHÒNG BAN', subtitle: 'Bộ phận / team', color: 'blue', icon: <Building2 className="h-4 w-4" /> },
  { kind: 'person', title: 'NHÂN SỰ', subtitle: 'Người / vai trò', color: 'emerald', icon: <Users className="h-4 w-4" /> },
  { kind: 'website', title: 'WEBSITE', subtitle: 'Web / landing page', color: 'indigo', icon: <ExternalLink className="h-4 w-4" /> },
  { kind: 'app', title: 'APP', subtitle: 'Mobile/Web app', color: 'emerald', icon: <Smartphone className="h-4 w-4" /> },
  { kind: 'system', title: 'SYSTEM', subtitle: 'Dịch vụ / nền tảng', color: 'slate', icon: <Box className="h-4 w-4" /> },
  { kind: 'database', title: 'DATABASE', subtitle: 'Dữ liệu / storage', color: 'rose', icon: <Database className="h-4 w-4" /> },
  { kind: 'process', title: 'PROCESS', subtitle: 'Quy trình / flow', color: 'amber', icon: <Workflow className="h-4 w-4" /> },
  { kind: 'external', title: 'EXTERNAL SERVICE', subtitle: 'Dịch vụ bên ngoài', color: 'indigo', icon: <GitBranch className="h-4 w-4" /> },
  { kind: 'marketing-channel', title: 'FANPAGE FACEBOOK', subtitle: 'Kênh marketing / inbox Facebook', color: 'blue', icon: <MessageSquare className="h-4 w-4" /> },
  { kind: 'marketing-channel', title: 'ZALO', subtitle: 'Kênh marketing / Zalo OA', color: 'blue', icon: <MessageSquare className="h-4 w-4" /> },
  { kind: 'marketing-channel', title: 'WHATSAPP', subtitle: 'Kênh marketing / WhatsApp', color: 'emerald', icon: <MessageSquare className="h-4 w-4" /> },
  { kind: 'marketing-channel', title: 'LINE', subtitle: 'Kênh marketing / Line Official', color: 'emerald', icon: <MessageSquare className="h-4 w-4" /> },
  { kind: 'note', title: 'NOTE', subtitle: 'Ghi chú', color: 'blue', icon: <LinkIcon className="h-4 w-4" /> },
];

const iconForNode = (node: DiagramNode) => {
  if (node.kind === 'ceo') return <ShieldCheck className="h-5 w-5" />;
  if (node.kind === 'website') return <ExternalLink className="h-5 w-5" />;
  if (node.kind === 'app') return <Smartphone className="h-5 w-5" />;
  if (node.kind === 'process') return <Workflow className="h-5 w-5" />;
  if (node.kind === 'database') return <Database className="h-5 w-5" />;
  if (node.kind === 'system') return <Box className="h-5 w-5" />;
  if (node.kind === 'person') return <Users className="h-5 w-5" />;
  if (node.kind === 'marketing-channel') return <MessageSquare className="h-5 w-5" />;
  if (node.id.includes('comms')) return <Megaphone className="h-5 w-5" />;
  if (node.id.includes('finance')) return <DollarSign className="h-5 w-5" />;
  if (node.id.includes('technical')) return <Cpu className="h-5 w-5" />;
  if (node.id.includes('hr')) return <Briefcase className="h-5 w-5" />;
  return <MessageSquare className="h-5 w-5" />;
};

const userKey = (user: OrgUser) => user.email || user.name;
const inferDepartmentFromRole = (role = '') => {
  const value = role.toLowerCase();
  if (value.includes('kế toán') || value.includes('tài chính')) return 'finance-dept';
  if (value.includes('kỹ thuật')) return 'technical';
  if (value.includes('hành chính') || value.includes('nhân sự')) return 'hr-dept';
  if (value.includes('content') || value.includes('media') || value.includes('truyền thông')) return 'comms-dept';
  return 'sales-mkt';
};

const getVisualNodeHeight = (node: DiagramNode, assignments: Record<string, string[]> = {}, memberAssignments: Record<string, string[]> = {}) => {
  if (node.kind !== 'department') return node.h;
  const ownerCount = assignments[node.id]?.length ?? 0;
  const memberCount = memberAssignments[node.id]?.length ?? 0;
  const visibleCount = Math.min(ownerCount, 2) + Math.min(memberCount, 2);
  return Math.max(node.h, 138 + visibleCount * 32 + (ownerCount + memberCount > 4 ? 22 : 0));
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderFormattedText = (value: string) => {
  const escaped = escapeHtml(value || '');
  return escaped
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
    .replace(/~~([\s\S]+?)~~/g, '<s>$1</s>')
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<span class="font-bold text-slate-400">•</span> $1')
    .replace(/\n/g, '<br />');
};

export const OrganizationChartPage = () => {
  const { users, loading, error } = useUsers();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const presentRef = useRef<HTMLDivElement | null>(null);
  const presentScrollRef = useRef<HTMLDivElement | null>(null);
  const detailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const connectorForwardDetailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const connectorBackwardDetailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const connectorSingleDetailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const nodeElementRefs = useRef<Record<string, HTMLElement | null>>({});
  const [pages, setPages] = useState<DiagramPage[]>(createDefaultPages());
  const pagesRef = useRef<DiagramPage[]>(pages);
  const [activePageId, setActivePageId] = useState('company-overview');
  const [selectedId, setSelectedId] = useState('sales-mkt');
  const [selectedIds, setSelectedIds] = useState<string[]>(['sales-mkt']);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [query, setQuery] = useState('');
  const [tool, setTool] = useState<'select' | 'connector'>('select');
  const [connectorFrom, setConnectorFrom] = useState<string | null>(null);
  const [connectorKind, setConnectorKind] = useState<ConnectorKind>('elbow');
  const [arrowKind, setArrowKind] = useState<ArrowKind>('one-way');
  const [dragMove, setDragMove] = useState<{ ids: string[]; startX: number; startY: number; positions: Record<string, { x: number; y: number }> } | null>(null);
  const [dragEmployeeKey, setDragEmployeeKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'edit' | 'present'>('edit');
  const [editFullscreen, setEditFullscreen] = useState(false);
  const [presentDetailNodeId, setPresentDetailNodeId] = useState<string | null>(null);
  const [presentDetailConnectorId, setPresentDetailConnectorId] = useState<string | null>(null);
  const [presentDetailConnectorSide, setPresentDetailConnectorSide] = useState<'single' | 'forward' | 'backward'>('single');
  const [hydrated, setHydrated] = useState(false);
  const [nodeSizes, setNodeSizes] = useState<Record<string, { w: number; h: number }>>({});
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; nodeId?: string } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [nodeClipboard, setNodeClipboard] = useState<DiagramNode[]>([]);

  const activePage = pages.find(page => page.id === activePageId) ?? pages[0];
  const diagram = activePage.data;
  const orgUsers = users as OrgUser[];
  const usersByKey = useMemo(() => new Map(orgUsers.map(user => [userKey(user), user])), [orgUsers]);
  const assignmentCountByUser = useMemo(() => {
    const counts = new Map<string, number>();
    [diagram.assignments, diagram.memberAssignments || {}].forEach(source => {
      Object.values(source || {}).forEach(keys => {
        Array.from(new Set(keys as string[])).forEach(key => counts.set(key, (counts.get(key) ?? 0) + 1));
      });
    });
    return counts;
  }, [diagram.assignments, diagram.memberAssignments]);
  const selectedNode = diagram.nodes.find(node => node.id === selectedId) ?? null;
  const selectedConnector = diagram.connectors.find(conn => conn.id === selectedConnectorId) ?? null;
  const presentDetailNode = diagram.nodes.find(node => node.id === presentDetailNodeId) ?? null;
  const presentDetailConnector = diagram.connectors.find(conn => conn.id === presentDetailConnectorId) ?? null;
  const selectedEmployees = selectedNode ? (diagram.assignments[selectedNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[] : [];
  const selectedMembers = selectedNode ? (diagram.memberAssignments?.[selectedNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[] : [];
  const filteredUsers = orgUsers.filter(user => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));

  const canvasSize = useMemo(() => {
    const maxHalfWidth = Math.max(0, ...diagram.nodes.map(node => Math.abs(node.x) + (nodeSizes[node.id]?.w ?? node.w) / 2));
    const maxHalfHeight = Math.max(0, ...diagram.nodes.map(node => Math.abs(node.y) + (nodeSizes[node.id]?.h ?? getVisualNodeHeight(node, diagram.assignments, diagram.memberAssignments)) / 2));
    return {
      width: Math.max(MIN_CANVAS_SIZE.width, Math.ceil((maxHalfWidth * 2 + CANVAS_PADDING * 2) / 24) * 24),
      height: Math.max(MIN_CANVAS_SIZE.height, Math.ceil((maxHalfHeight * 2 + CANVAS_PADDING * 2) / 24) * 24),
    };
  }, [diagram.nodes, diagram.assignments, diagram.memberAssignments, nodeSizes]);

  const canvasOrigin = useMemo(() => ({ x: canvasSize.width / 2, y: canvasSize.height / 2 }), [canvasSize]);
  const nodeSizeFor = (node: DiagramNode) => nodeSizes[node.id] ?? { w: node.w, h: getVisualNodeHeight(node, diagram.assignments, diagram.memberAssignments) };
  const nodeBox = (node: DiagramNode) => {
    const size = nodeSizeFor(node);
    return {
      ...size,
      left: canvasOrigin.x + node.x - size.w / 2,
      top: canvasOrigin.y - node.y - size.h / 2,
    };
  };
  const screenPointFromEvent = (event: PointerEvent | React.PointerEvent) => {
    const element = canvasRef.current;
    if (!element) return { x: canvasOrigin.x, y: canvasOrigin.y };
    const rect = element.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left + element.scrollLeft) / zoom,
      y: (event.clientY - rect.top + element.scrollTop) / zoom,
    };
  };
  const cartesianPointFromEvent = (event: PointerEvent | React.PointerEvent) => {
    const point = screenPointFromEvent(event);
    return { x: point.x - canvasOrigin.x, y: canvasOrigin.y - point.y };
  };

  const setDiagramPages = (updater: DiagramPage[] | ((prev: DiagramPage[]) => DiagramPage[])) => {
    const next = typeof updater === 'function' ? updater(pagesRef.current) : updater;
    pagesRef.current = next;
    setPages(next);
    return next;
  };

  const updateActivePageData = (updater: (data: DiagramData) => DiagramData) => {
    setDiagramPages(prev => prev.map(page => page.id === activePageId ? { ...page, data: updater(page.data) } : page));
  };

  useEffect(() => {
    const measureNode = (id: string, element: HTMLElement) => {
      const size = { w: element.offsetWidth, h: element.offsetHeight };
      if (!size.w || !size.h) return;
      setNodeSizes(prev => {
        const current = prev[id];
        if (current && Math.abs(current.w - size.w) < 1 && Math.abs(current.h - size.h) < 1) return prev;
        return { ...prev, [id]: size };
      });
    };

    diagram.nodes.forEach(node => {
      const element = nodeElementRefs.current[node.id];
      if (element) measureNode(node.id, element);
    });

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      setNodeSizes(prev => {
        let changed = false;
        const next = { ...prev };
        entries.forEach(entry => {
          const element = entry.target as HTMLElement;
          const id = element.dataset.nodeId;
          if (!id) return;
          const size = { w: element.offsetWidth, h: element.offsetHeight };
          const current = next[id];
          if (!current || Math.abs(current.w - size.w) >= 1 || Math.abs(current.h - size.h) >= 1) {
            next[id] = size;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });

    diagram.nodes.forEach(node => {
      const element = nodeElementRefs.current[node.id];
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [activePageId, viewMode, diagram.nodes, diagram.assignments, diagram.memberAssignments]);

  useEffect(() => {
    const normalizePages = (items: any[]): DiagramPage[] => items.map((row: any, index: number) => ({
      id: row.id || `page-${index}`,
      title: row.title || 'Sơ đồ',
      description: row.description || '',
      sort_order: row.sort_order ?? index,
      data: normalizeDiagramData(row.data || {}),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const loadPages = async () => {
      try {
        const rows = await diagramService.getPages();
        if (Array.isArray(rows) && rows.length > 0) {
          const normalized = ensureRequiredDiagramPages(normalizePages(rows));
          setDiagramPages(normalized);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          for (const pageId of ['sales-flow', 'system-map']) {
            const requiredPage = normalized.find(page => page.id === pageId);
            if (requiredPage && !(rows as any[]).some(row => row.id === pageId && (row.data?.nodes || []).length > 0)) await diagramService.savePage(requiredPage);
          }
          setActivePageId(current => normalized.some(page => page.id === current) ? current : normalized[0].id);
          return;
        }

        const defaults = ensureRequiredDiagramPages(createDefaultPages());
        setDiagramPages(defaults);
        setActivePageId(defaults[0].id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        for (const page of defaults) {
          await diagramService.savePage(page);
        }
      } catch (err) {
        console.warn('Diagram API unavailable, using local/default pages:', err);
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as DiagramPage[];
            if (Array.isArray(parsed) && parsed.length) {
              const localPages = ensureRequiredDiagramPages(normalizePages(parsed));
              setDiagramPages(localPages);
              setActivePageId(localPages[0].id);
              return;
            }
          }
        } catch (localErr) {
          console.warn('Cannot read local diagram pages:', localErr);
        }
        const defaults = ensureRequiredDiagramPages(createDefaultPages());
        setDiagramPages(defaults);
        setActivePageId(defaults[0].id);
      } finally {
        setHydrated(true);
      }
    };
    loadPages();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages, hydrated]);

  const savePagesToDatabase = async () => {
    setSaveStatus('saving');
    try {
      const latestPages = pagesRef.current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latestPages));
      for (const page of latestPages) {
        await diagramService.savePage(page);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
        setPresentDetailNodeId(null);
        setPresentDetailConnectorId(null);
        setPresentDetailConnectorSide('single');
        if (viewMode === 'present') setViewMode('edit');
        if (editFullscreen) setEditFullscreen(false);
      }
      const target = event.target as HTMLElement | null;
      const isTextInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && viewMode === 'edit') {
        event.preventDefault();
        savePagesToDatabase();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && !isTextInput && viewMode === 'edit') {
        const ids = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
        if (ids.length > 0 && !selectedConnectorId) {
          event.preventDefault();
          copySelectedNodes();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && !isTextInput && viewMode === 'edit') {
        if (nodeClipboard.length > 0) {
          event.preventDefault();
          pasteCopiedNodes();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !isTextInput) {
        event.preventDefault();
        const ids = diagram.nodes.map(node => node.id);
        setSelectedConnectorId(null);
        setSelectedIds(ids);
        setSelectedId(ids[0] || '');
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTextInput && viewMode === 'edit') {
        const selectedNodeForDelete = diagram.nodes.find(node => node.id === selectedId) ?? null;
        if (selectedConnectorId || (selectedNodeForDelete && selectedNodeForDelete.kind !== 'ceo')) {
          event.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [diagram.nodes, selectedId, selectedIds, selectedConnectorId, viewMode, editFullscreen, selectedNode, selectedConnector, pages, nodeClipboard]);

  useEffect(() => {
    if (!orgUsers.length) return;
    updateActivePageData(data => {
      const currentKeys = new Set(Object.values(data.assignments || {}).flat());
      const nextAssignments = { ...(data.assignments || {}) };
      let changed = false;
      orgUsers.forEach(user => {
        const key = userKey(user);
        if (currentKeys.has(key)) return;
        const deptId = data.nodes.some(node => node.id === inferDepartmentFromRole(user.role)) ? inferDepartmentFromRole(user.role) : data.nodes.find(node => node.kind === 'department')?.id;
        if (!deptId) return;
        nextAssignments[deptId] = [...(nextAssignments[deptId] ?? []), key];
        changed = true;
      });
      return changed ? { ...data, assignments: nextAssignments } : data;
    });
  }, [orgUsers.length, activePageId]);

  useEffect(() => {
    const element = viewMode === 'present' ? presentScrollRef.current : canvasRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      if (viewMode !== 'present' && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY > 0 ? -1 : 1;
      setZoom(current => Math.min(2, Math.max(0.25, Number((current + direction * 0.08).toFixed(2)))));
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  useEffect(() => {
    const element = viewMode === 'present' ? presentScrollRef.current : canvasRef.current;
    if (!element) return;
    requestAnimationFrame(() => {
      element.scrollLeft = Math.max(0, canvasOrigin.x * zoom - element.clientWidth / 2);
      element.scrollTop = Math.max(0, canvasOrigin.y * zoom - element.clientHeight / 2);
    });
  }, [viewMode, activePageId]);

  useEffect(() => {
    if (!dragMove) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = (event.clientX - dragMove.startX) / zoom;
      const dy = (event.clientY - dragMove.startY) / zoom;
      updateActivePageData(data => ({
        ...data,
        nodes: data.nodes.map(node => {
          const start = dragMove.positions[node.id];
          return start ? { ...node, x: start.x + dx, y: start.y - dy } : node;
        }),
      }));
    };
    const handlePointerUp = () => setDragMove(null);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragMove, zoom, activePageId]);

  const addPage = () => {
    const id = `page-${Date.now()}`;
    const newPage: DiagramPage = { id, title: 'Sơ đồ mới', description: 'Trang sơ đồ con', sort_order: pages.length, data: normalizeDiagramData({}) };
    setDiagramPages(prev => [...prev, newPage]);
    setActivePageId(id);
    setSelectedId('');
    setSelectedIds([]);
    setSelectedConnectorId(null);
  };


  const updateActivePageMeta = (patch: Partial<Pick<DiagramPage, 'title' | 'description'>>) => {
    setDiagramPages(prev => prev.map(page => page.id === activePageId ? { ...page, ...patch } : page));
  };

  const addShape = (shape: typeof shapeLibrary[number]) => {
    const id = `${shape.kind}-${Date.now()}`;
    const node: DiagramNode = {
      id,
      kind: shape.kind,
      title: shape.title,
      subtitle: shape.subtitle,
      detail: '',
      color: shape.color,
      x: 0,
      y: 0,
      w: shape.kind === 'note' ? 210 : 230,
      h: shape.kind === 'note' ? 120 : 150,
      teams: shape.kind === 'department' ? ['Nhóm mới'] : [],
    };
    updateActivePageData(data => ({
      ...data,
      nodes: [...data.nodes, node],
      assignments: shape.kind === 'department' ? { ...data.assignments, [id]: [] } : data.assignments,
    }));
    setSelectedId(id);
    setSelectedIds([id]);
    setSelectedConnectorId(null);
  };

  const updateSelectedNode = (patch: Partial<DiagramNode>) => {
    if (!selectedNode) return;
    updateActivePageData(data => ({ ...data, nodes: data.nodes.map(node => node.id === selectedNode.id ? { ...node, ...patch } : node) }));
  };
  const copySelectedNodes = () => {
    const ids = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
    const nodesToCopy = diagram.nodes.filter(node => ids.includes(node.id));
    if (!nodesToCopy.length) return;
    setNodeClipboard(nodesToCopy.map(node => ({ ...node })));
    setContextMenu(null);
  };

  const pasteCopiedNodes = () => {
    if (!nodeClipboard.length) return;
    const stamp = Date.now();
    const idMap = new Map(nodeClipboard.map((node, index) => [node.id, `${node.kind}-${stamp}-${index}`]));
    const pastedNodes = nodeClipboard.map((node, index) => ({
      ...node,
      id: idMap.get(node.id) || `${node.kind}-${stamp}-${index}`,
      title: nodeClipboard.length === 1 ? `${node.title} copy` : node.title,
      x: node.x + 40,
      y: node.y - 40,
    }));
    const pastedIds = pastedNodes.map(node => node.id);
    updateActivePageData(data => ({
      ...data,
      nodes: [...data.nodes, ...pastedNodes],
      assignments: pastedIds.reduce((acc, id) => ({ ...acc, [id]: [] }), data.assignments || {}),
        memberAssignments: pastedIds.reduce((acc, id) => ({ ...acc, [id]: [] }), data.memberAssignments || {}),
    }));
    setSelectedConnectorId(null);
    setSelectedIds(pastedIds);
    setSelectedId(pastedIds[0] || '');
    setContextMenu(null);
  };


  const applyTextFormat = (
    current: string,
    update: (value: string) => void,
    textarea: HTMLTextAreaElement | null,
    prefix: string,
    suffix = prefix,
    placeholder = 'nội dung',
  ) => {
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selectedText = current.slice(start, end) || placeholder;
    const nextDetail = `${current.slice(0, start)}${prefix}${selectedText}${suffix}${current.slice(end)}`;
    update(nextDetail);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selectedText.length;
      textarea?.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const applyDetailFormat = (prefix: string, suffix = prefix, placeholder = 'nội dung') => {
    if (!selectedNode) return;
    applyTextFormat(selectedNode.detail ?? '', value => updateSelectedNode({ detail: value }), detailTextareaRef.current, prefix, suffix, placeholder);
  };

  const applyConnectorDetailFormat = (field: 'detail' | 'forwardDetail' | 'backwardDetail', ref: React.RefObject<HTMLTextAreaElement | null>, prefix: string, suffix = prefix, placeholder = 'nội dung') => {
    if (!selectedConnector) return;
    const current = field === 'forwardDetail'
      ? (selectedConnector.forwardDetail ?? selectedConnector.detail ?? '')
      : field === 'backwardDetail'
        ? (selectedConnector.backwardDetail ?? '')
        : (selectedConnector.detail ?? '');
    applyTextFormat(current, value => updateSelectedConnector({ [field]: value }), ref.current, prefix, suffix, placeholder);
  };

  const insertDetailBullet = () => applyDetailFormat('- ', '', 'ý chính');
  const insertConnectorDetailBullet = (field: 'detail' | 'forwardDetail' | 'backwardDetail', ref: React.RefObject<HTMLTextAreaElement | null>) => applyConnectorDetailFormat(field, ref, '- ', '', 'ý chính');

  const updateSelectedConnector = (patch: Partial<Connector>) => {
    if (!selectedConnector) return;
    updateActivePageData(data => ({ ...data, connectors: data.connectors.map(conn => conn.id === selectedConnector.id ? { ...conn, ...patch } : conn) }));
  };

  const addConnector = (from: string, to: string) => {
    if (from === to) return;
    updateActivePageData(data => ({ ...data, connectors: [...data.connectors, { id: `conn-${Date.now()}`, from, to, kind: connectorKind, arrow: arrowKind, label: '' }] }));
  };

  const deleteSelected = () => {
    if (selectedConnector) {
      updateActivePageData(data => ({ ...data, connectors: data.connectors.filter(conn => conn.id !== selectedConnector.id) }));
      setSelectedConnectorId(null);
      return;
    }
    if (!selectedNode || selectedNode.kind === 'ceo') return;
    updateActivePageData(data => {
      const { [selectedNode.id]: _removedUsers, ...restAssignments } = data.assignments || {};
      const { [selectedNode.id]: _removedMembers, ...restMemberAssignments } = data.memberAssignments || {};
      return {
        ...data,
        nodes: data.nodes.filter(node => node.id !== selectedNode.id),
        connectors: data.connectors.filter(conn => conn.from !== selectedNode.id && conn.to !== selectedNode.id),
        lockedGroups: (data.lockedGroups || []).map(group => group.filter(id => id !== selectedNode.id)).filter(group => group.length > 1),
        lockedNodeIds: (data.lockedNodeIds || []).filter(id => id !== selectedNode.id),
        assignments: restAssignments,
        memberAssignments: restMemberAssignments,
      };
    });
    setSelectedId('');
  };

  const assignEmployee = (employeeKey: string, deptId: string, role: 'owner' | 'member' = 'owner') => {
    updateActivePageData(data => {
      const ownerAssignments = { ...(data.assignments || {}) };
      const memberAssignments = { ...(data.memberAssignments || {}) };
      if (role === 'owner') {
        ownerAssignments[deptId] = Array.from(new Set([...(ownerAssignments[deptId] ?? []), employeeKey]));
        memberAssignments[deptId] = (memberAssignments[deptId] ?? []).filter(key => key !== employeeKey);
      } else {
        memberAssignments[deptId] = Array.from(new Set([...(memberAssignments[deptId] ?? []), employeeKey]));
        ownerAssignments[deptId] = (ownerAssignments[deptId] ?? []).filter(key => key !== employeeKey);
      }
      return { ...data, assignments: ownerAssignments, memberAssignments };
    });
    setSelectedId(deptId);
  };

  const unassignEmployee = (employeeKey: string, deptId?: string, role?: 'owner' | 'member') => {
    updateActivePageData(data => {
      const removeFrom = (source: Record<string, string[]> = {}) => deptId
        ? { ...source, [deptId]: (source[deptId] ?? []).filter(key => key !== employeeKey) }
        : Object.fromEntries(Object.entries(source).map(([id, keys]) => [id, (keys as string[]).filter(key => key !== employeeKey)])) as Record<string, string[]>;
      return {
        ...data,
        assignments: role === 'member' ? data.assignments : removeFrom(data.assignments || {}),
        memberAssignments: role === 'owner' ? data.memberAssignments : removeFrom(data.memberAssignments || {}),
      };
    });
  };

  const startCanvasPointerDown = (event: React.PointerEvent) => {
    if (tool !== 'select' || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-node-id]') || target.closest('[data-connector]')) return;
    event.preventDefault();

    if (!event.shiftKey) {
      const element = canvasRef.current;
      if (!element) return;
      const startX = event.clientX;
      const startY = event.clientY;
      const startScrollLeft = element.scrollLeft;
      const startScrollTop = element.scrollTop;
      setIsPanning(true);

      const handleMove = (moveEvent: PointerEvent) => {
        element.scrollLeft = startScrollLeft - (moveEvent.clientX - startX);
        element.scrollTop = startScrollTop - (moveEvent.clientY - startY);
      };
      const handleUp = () => {
        setIsPanning(false);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp, { once: true });
      return;
    }

    const start = screenPointFromEvent(event);
    const additive = event.ctrlKey || event.metaKey;
    const initialSelection = additive ? selectedIds : [];
    setSelectedConnectorId(null);
    if (!additive) {
      setSelectedId('');
      setSelectedIds([]);
    }
    setSelectionBox({ x: start.x, y: start.y, w: 0, h: 0 });

    const handleMove = (moveEvent: PointerEvent) => {
      const current = screenPointFromEvent(moveEvent);
      setSelectionBox({
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        w: Math.abs(current.x - start.x),
        h: Math.abs(current.y - start.y),
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const end = screenPointFromEvent(upEvent);
      const rect = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x - start.x), h: Math.abs(end.y - start.y) };
      const picked = diagram.nodes.filter(node => {
        const box = nodeBox(node);
        return box.left < rect.x + rect.w && box.left + box.w > rect.x && box.top < rect.y + rect.h && box.top + box.h > rect.y;
      }).map(node => node.id);
      const next = Array.from(new Set([...initialSelection, ...picked]));
      setSelectedIds(next);
      setSelectedId(next[0] || '');
      setSelectionBox(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };


  const toggleNodeSelection = (nodeId: string) => {
    setSelectedConnectorId(null);
    setSelectedIds(prev => {
      const exists = prev.includes(nodeId);
      const next = exists ? prev.filter(id => id !== nodeId) : [...prev, nodeId];
      setSelectedId(next[0] || '');
      return next;
    });
  };

  const lockedGroupForNode = (nodeId: string) => (diagram.lockedGroups || []).find(group => group.includes(nodeId)) || null;
  const isNodeCoordinateLocked = (nodeId: string) => (diagram.lockedNodeIds || []).includes(nodeId);

  const toggleContextNodeCoordinateLock = () => {
    const nodeId = contextMenu?.nodeId;
    if (!nodeId) return;
    updateActivePageData(data => {
      const lockedIds = new Set(data.lockedNodeIds || []);
      if (lockedIds.has(nodeId)) lockedIds.delete(nodeId);
      else lockedIds.add(nodeId);
      return { ...data, lockedNodeIds: Array.from(lockedIds) };
    });
    setContextMenu(null);
  };

  const lockSelectedGroup = () => {
    const ids = selectedIds.length > 1 ? selectedIds : contextMenu?.nodeId ? [contextMenu.nodeId] : [];
    if (ids.length < 2) return;
    updateActivePageData(data => {
      const selectedSet = new Set(ids);
      const remainingGroups = (data.lockedGroups || []).filter(group => !group.some(id => selectedSet.has(id)));
      return { ...data, lockedGroups: [...remainingGroups, ids] };
    });
    setSelectedIds(ids);
    setSelectedId(ids[0] || '');
    setContextMenu(null);
  };

  const unlockContextGroup = () => {
    const nodeId = contextMenu?.nodeId || selectedIds[0];
    if (!nodeId) return;
    updateActivePageData(data => ({ ...data, lockedGroups: (data.lockedGroups || []).filter(group => !group.includes(nodeId)) }));
    setContextMenu(null);
  };

  const startNodeDrag = (node: DiagramNode, event: React.PointerEvent) => {
    const lockedGroup = lockedGroupForNode(node.id);
    const ids = (lockedGroup || ((event.ctrlKey || event.metaKey) && selectedIds.includes(node.id) && selectedIds.length > 1 ? selectedIds : [node.id]))
      .filter(id => !isNodeCoordinateLocked(id));
    if (!ids.length) return;
    const positions = Object.fromEntries(diagram.nodes.filter(item => ids.includes(item.id)).map(item => [item.id, { x: item.x, y: item.y }]));
    setDragMove({ ids, startX: event.clientX, startY: event.clientY, positions });
  };

  const openContextMenu = (event: React.MouseEvent, nodeId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (nodeId && !selectedIds.includes(nodeId)) {
      setSelectedId(nodeId);
      setSelectedIds([nodeId]);
      setSelectedConnectorId(null);
    }
    setContextMenu({ screenX: event.clientX, screenY: event.clientY, nodeId });
  };

  const resetLayout = () => {
    setDiagramPages(prev => prev.map(page => page.id === activePageId ? { ...page, data: createDefaultData() } : page));
    setSelectedId('sales-mkt');
    setSelectedIds(['sales-mkt']);
  };

  const layoutSelection = (axis: 'horizontal' | 'vertical') => {
    const selectedNodeIds = selectedIds.length > 0
      ? new Set(selectedIds)
      : selectedId
        ? new Set([selectedId])
        : new Set(diagram.nodes.map(node => node.id));
    const selectedNodes = diagram.nodes.filter(node => selectedNodeIds.has(node.id) && !isNodeCoordinateLocked(node.id));
    if (selectedNodes.length < 2) return;

    const minX = Math.min(...selectedNodes.map(node => node.x));
    const topY = Math.max(...selectedNodes.map(node => node.y));
    const maxWidth = Math.max(...selectedNodes.map(node => nodeSizes[node.id]?.w ?? node.w));
    const maxHeight = Math.max(...selectedNodes.map(node => nodeSizes[node.id]?.h ?? getVisualNodeHeight(node, diagram.assignments, diagram.memberAssignments)));
    const columnGap = Math.max(260, maxWidth + 70);
    const rowGap = Math.max(170, maxHeight + 60);
    const sorted = [...selectedNodes].sort((a, b) => axis === 'horizontal' ? (a.x - b.x) || (a.y - b.y) : (a.y - b.y) || (a.x - b.x));
    const snap = (value: number) => Math.round(value / 24) * 24;

    updateActivePageData(data => ({
      ...data,
      nodes: data.nodes.map(node => {
        const index = sorted.findIndex(item => item.id === node.id);
        if (index === -1) return node;
        return axis === 'horizontal'
          ? { ...node, x: snap(minX + index * columnGap), y: snap(topY) }
          : { ...node, x: snap(minX), y: snap(topY - index * rowGap) };
      }),
    }));
  };

  const distributeSelection = (axis: 'horizontal' | 'vertical') => {
    const selectedNodeIds = selectedIds.length > 0
      ? new Set(selectedIds)
      : selectedId
        ? new Set([selectedId])
        : new Set<string>();
    const selectedNodes = diagram.nodes.filter(node => selectedNodeIds.has(node.id) && !isNodeCoordinateLocked(node.id));
    if (selectedNodes.length < 3) return;

    const snap = (value: number) => Math.round(value / 24) * 24;
    const sorted = [...selectedNodes].sort((a, b) => axis === 'horizontal' ? (a.x - b.x) || (b.y - a.y) : (b.y - a.y) || (a.x - b.x));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const step = axis === 'horizontal'
      ? (last.x - first.x) / (sorted.length - 1)
      : (first.y - last.y) / (sorted.length - 1);

    updateActivePageData(data => ({
      ...data,
      nodes: data.nodes.map(node => {
        const index = sorted.findIndex(item => item.id === node.id);
        if (index === -1) return node;
        return axis === 'horizontal'
          ? { ...node, x: snap(first.x + index * step) }
          : { ...node, y: snap(first.y - index * step) };
      }),
    }));
  };

  const alignSelectionHorizontal = () => layoutSelection('horizontal');
  const alignSelectionVertical = () => layoutSelection('vertical');
  const distributeSelectionHorizontal = () => distributeSelection('horizontal');
  const distributeSelectionVertical = () => distributeSelection('vertical');


  const exportJson = () => {
    const blob = new Blob([JSON.stringify(pages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skymobile-diagrams.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openNodeLink = (node: DiagramNode) => {
    if (node.drillPageId) {
      setActivePageId(node.drillPageId);
      setSelectedId('');
      setSelectedConnectorId(null);
      return;
    }
    if (node.linkUrl) window.open(node.linkUrl, '_blank', 'noopener,noreferrer');
  };

  const connectorGeometry = (connector: Connector) => {
    const from = diagram.nodes.find(node => node.id === connector.from);
    const to = diagram.nodes.find(node => node.id === connector.to);
    if (!from || !to) return null;

    const nodeSize = (node: DiagramNode) => nodeSizeFor(node);
    const nodeCenter = (node: DiagramNode) => ({ x: canvasOrigin.x + node.x, y: canvasOrigin.y - node.y });
    const fromCenter = nodeCenter(from);
    const toCenter = nodeCenter(to);
    const edgePoint = (node: DiagramNode, toward: { x: number; y: number }) => {
      const size = nodeSize(node);
      const center = nodeCenter(node);
      const dx = toward.x - center.x;
      const dy = toward.y - center.y;
      const halfW = size.w / 2;
      const halfH = size.h / 2;
      const scale = Math.min(Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity, Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity);
      const markerGap = connector.arrow === 'two-way' || connector.arrow === 'one-way' ? 3 : 0;
      const safeScale = Math.max(0, scale - markerGap / (Math.hypot(dx, dy) || 1));
      return { x: center.x + dx * safeScale, y: center.y + dy * safeScale };
    };

    const start = edgePoint(from, toCenter);
    const end = edgePoint(to, fromCenter);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const offset = 6;
    const forwardStart = { x: start.x + nx * offset, y: start.y + ny * offset };
    const forwardEnd = { x: end.x + nx * offset, y: end.y + ny * offset };
    const backwardStart = { x: end.x - nx * offset, y: end.y - ny * offset };
    const backwardEnd = { x: start.x - nx * offset, y: start.y - ny * offset };

    const pathBetween = (a: { x: number; y: number }, b: { x: number; y: number }, kind: ConnectorKind) => {
      const bend = connector.bend ?? 0;
      if (kind === 'straight') return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      if (kind === 'curved') {
        const c1x = a.x + (b.x - a.x) * 0.35;
        const c2x = a.x + (b.x - a.x) * 0.65;
        return `M ${a.x} ${a.y} C ${c1x} ${a.y + bend}, ${c2x} ${b.y + bend}, ${b.x} ${b.y}`;
      }
      const routeMode = connector.routeMode ?? 'auto';
      const useHorizontal = routeMode === 'horizontal' || (routeMode === 'auto' && Math.abs(b.x - a.x) > Math.abs(b.y - a.y));
      if (useHorizontal) {
        const midX = a.x + (b.x - a.x) / 2 + bend;
        return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
      }
      const midY = a.y + (b.y - a.y) / 2 + bend;
      return `M ${a.x} ${a.y} L ${a.x} ${midY} L ${b.x} ${midY} L ${b.x} ${b.y}`;
    };

    const labelPointBetween = (a: { x: number; y: number }, b: { x: number; y: number }, kind: ConnectorKind, labelOffsetY: number) => {
      const bend = connector.bend ?? 0;
      if (kind === 'curved') {
        const t = 0.5;
        const oneMinusT = 1 - t;
        const c1 = { x: a.x + (b.x - a.x) * 0.35, y: a.y + bend };
        const c2 = { x: a.x + (b.x - a.x) * 0.65, y: b.y + bend };
        return {
          x: oneMinusT ** 3 * a.x + 3 * oneMinusT ** 2 * t * c1.x + 3 * oneMinusT * t ** 2 * c2.x + t ** 3 * b.x,
          y: oneMinusT ** 3 * a.y + 3 * oneMinusT ** 2 * t * c1.y + 3 * oneMinusT * t ** 2 * c2.y + t ** 3 * b.y + labelOffsetY,
        };
      }
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + labelOffsetY };
    };

    return {
      singlePath: pathBetween(start, end, connector.kind),
      forwardPath: pathBetween(forwardStart, forwardEnd, connector.kind),
      backwardPath: pathBetween(backwardStart, backwardEnd, connector.kind),
      labels: {
        single: labelPointBetween(start, end, connector.kind, connector.kind === 'curved' ? -6 : -8),
        forward: labelPointBetween(forwardStart, forwardEnd, connector.kind, connector.kind === 'curved' ? -10 : -14),
        backward: labelPointBetween(backwardStart, backwardEnd, connector.kind, connector.kind === 'curved' ? 16 : 22),
      },
    };
  };

  const connectorPath = (connector: Connector) => connectorGeometry(connector)?.singlePath || '';

  const requestPresentationFullscreen = () => {
    const element = presentRef.current;
    if (element?.requestFullscreen) element.requestFullscreen().catch(() => undefined);
  };

  const startPresentPan = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const element = presentScrollRef.current;
    if (!element) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startScrollLeft = element.scrollLeft;
    const startScrollTop = element.scrollTop;
    setIsPanning(true);

    const handleMove = (moveEvent: PointerEvent) => {
      element.scrollLeft = startScrollLeft - (moveEvent.clientX - startX);
      element.scrollTop = startScrollTop - (moveEvent.clientY - startY);
    };
    const handleUp = () => {
      setIsPanning(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const renderEmployeeCard = (user: OrgUser, options?: { assignedDeptId?: string; role?: 'owner' | 'member' }) => {
    const key = userKey(user);
    return <div key={key} draggable onDragStart={() => setDragEmployeeKey(key)} onDragEnd={() => setDragEmployeeKey(null)} className="flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm hover:border-blue-300">
      {user.picture ? <img src={user.picture} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</div>}
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{user.name || user.email}</p><p className="truncate text-[11px] text-slate-500">{user.role || 'Chưa có vai trò'}{(assignmentCountByUser.get(key) ?? 0) > 0 ? ` · ${assignmentCountByUser.get(key)} vị trí` : ''}</p></div>
      {options?.assignedDeptId && <button type="button" onClick={event => { event.stopPropagation(); unassignEmployee(key, options.assignedDeptId, options.role); }} className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50">Gỡ</button>}
    </div>;
  };

  if (viewMode === 'present') {
    return (
      <div ref={presentRef} className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Presentation mode</p>
            <h2 className="truncate text-xl font-black">{activePage.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={activePageId} onChange={event => { setActivePageId(event.target.value); setSelectedId(''); setSelectedIds([]); setSelectedConnectorId(null); }} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none">
              {pages.map(page => <option key={page.id} value={page.id} className="bg-slate-900 text-white">{page.title}</option>)}
            </select>
            <button onClick={() => setZoom(v => Math.max(0.35, v - 0.1))} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><ZoomOut className="h-4 w-4" /></button>
            <span className="w-14 text-center text-xs font-bold text-white/80">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(v => Math.min(1.5, v + 0.1))} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={requestPresentationFullscreen} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20"><Maximize2 className="h-4 w-4" /> Fullscreen</button>
            <button onClick={() => setViewMode('edit')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500">Quay lại chỉnh sửa</button>
          </div>
        </div>
        <div ref={presentScrollRef} onPointerDown={startPresentPan} className={`relative flex-1 overflow-auto bg-slate-900 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}> 
          <div className="relative origin-top-left" style={{ width: canvasSize.width, height: canvasSize.height, transform: `scale(${zoom})`, backgroundColor: '#f8fafc', backgroundImage: 'linear-gradient(#dbe3ef 1px, transparent 1px), linear-gradient(90deg, #dbe3ef 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <svg className="absolute inset-0 h-full w-full">
              <defs><marker id="present-arrow-end" markerWidth="6" markerHeight="6" refX="5.5" refY="2.5" orient="auto" markerUnits="strokeWidth" viewBox="0 0 6 5"><path d="M0,0 L0,5 L6,2.5 z" fill="#475569" /></marker><marker id="present-arrow-start" markerWidth="6" markerHeight="6" refX="0.5" refY="2.5" orient="auto" markerUnits="strokeWidth" viewBox="0 0 6 5"><path d="M6,0 L6,5 L0,2.5 z" fill="#475569" /></marker></defs>
              {diagram.connectors.map(conn => {
                const geometry = connectorGeometry(conn);
                if (!geometry) return null;
                const openConnectorDetail = (side: 'single' | 'forward' | 'backward') => {
                  setPresentDetailNodeId(null);
                  setPresentDetailConnectorId(conn.id);
                  setPresentDetailConnectorSide(side);
                };
                const labelHandlers = (side: 'single' | 'forward' | 'backward') => ({
                  onPointerDown: (event: React.PointerEvent<SVGGElement>) => { event.stopPropagation(); if (event.button === 2) event.preventDefault(); },
                  onMouseDown: (event: React.MouseEvent<SVGGElement>) => { event.stopPropagation(); if (event.button === 2) event.preventDefault(); },
                  onClick: (event: React.MouseEvent<SVGGElement>) => { event.preventDefault(); event.stopPropagation(); openConnectorDetail(side); },
                  onContextMenu: (event: React.MouseEvent<SVGGElement>) => { event.preventDefault(); event.stopPropagation(); openConnectorDetail(side); },
                });
                return <g key={conn.id} className="cursor-pointer">
                  {conn.arrow === 'two-way' ? <>
                    <path d={geometry.forwardPath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" onClick={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('forward'); }} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('forward'); }} />
                    <path d={geometry.backwardPath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" onClick={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('backward'); }} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('backward'); }} />
                    <path d={geometry.forwardPath} fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#present-arrow-end)" />
                    <path d={geometry.backwardPath} fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#present-arrow-end)" />
                    {conn.forwardLabel && <g {...labelHandlers('forward')}><rect x={geometry.labels.forward.x - 58} y={geometry.labels.forward.y - 15} width="116" height="22" rx="8" fill="white" stroke="#bfdbfe" /><text x={geometry.labels.forward.x} y={geometry.labels.forward.y} textAnchor="middle" className="fill-blue-700 text-xs font-bold">{conn.forwardLabel}</text></g>}
                    {conn.backwardLabel && <g {...labelHandlers('backward')}><rect x={geometry.labels.backward.x - 58} y={geometry.labels.backward.y - 15} width="116" height="22" rx="8" fill="white" stroke="#fecdd3" /><text x={geometry.labels.backward.x} y={geometry.labels.backward.y} textAnchor="middle" className="fill-rose-700 text-xs font-bold">{conn.backwardLabel}</text></g>}
                  </> : <>
                    <path d={geometry.singlePath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" onClick={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('single'); }} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); openConnectorDetail('single'); }} />
                    <path d={geometry.singlePath} fill="none" stroke="#475569" strokeWidth="2" markerEnd={conn.arrow === 'one-way' ? 'url(#present-arrow-end)' : undefined} />
                    {conn.label && <g {...labelHandlers('single')}><rect x={geometry.labels.single.x - 58} y={geometry.labels.single.y - 15} width="116" height="22" rx="8" fill="white" stroke="#cbd5e1" /><text x={geometry.labels.single.x} y={geometry.labels.single.y} textAnchor="middle" className="fill-slate-700 text-xs font-bold">{conn.label}</text></g>}
                  </>}
                </g>;
              })}
            </svg>
            {diagram.nodes.map(node => {
              const colors = colorClass[node.color] ?? colorClass.blue;
              const employees = (diagram.assignments[node.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[];
              const members = (diagram.memberAssignments?.[node.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[];
              const box = nodeBox(node);
              return <div key={node.id} role="button" tabIndex={0} data-node-id={node.id} ref={element => { nodeElementRefs.current[node.id] = element; }} onPointerDown={event => { event.stopPropagation(); if (event.button === 2) { event.preventDefault(); setPresentDetailConnectorId(null); setPresentDetailConnectorSide('single'); setPresentDetailNodeId(node.id); } }} onMouseDown={event => { if (event.button === 2) { event.preventDefault(); event.stopPropagation(); setPresentDetailConnectorId(null); setPresentDetailConnectorSide('single'); setPresentDetailNodeId(node.id); } }} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); setPresentDetailConnectorId(null); setPresentDetailConnectorSide('single'); setPresentDetailNodeId(node.id); }} onDoubleClick={() => openNodeLink(node)} onClick={() => setSelectedId(node.id)} className="absolute overflow-hidden rounded-2xl border-2 border-slate-200 bg-white text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl" style={{ left: box.left, top: box.top, width: node.w, minHeight: node.h }}>
                <div className={`flex items-center justify-between gap-3 px-4 py-3 ${colors.header}`}><div className="flex min-w-0 items-center gap-2">{iconForNode(node)}<h3 className="truncate text-sm font-black">{node.title}</h3></div>{(node.linkUrl || node.drillPageId) && <ExternalLink className="h-4 w-4 opacity-80" />}</div>
                <div className="p-4"><p className="mb-3 text-xs font-medium text-slate-500">{node.subtitle}</p><div className="space-y-2"><div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"><Users className="mr-1 inline h-3.5 w-3.5" /> Phụ trách: {employees.length}</div><div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><Users className="mr-1 inline h-3.5 w-3.5" /> Thành viên: {members.length}</div></div></div>
              </div>;
            })}
          </div>
        </div>
        {presentDetailNode && <aside onPointerDown={event => event.stopPropagation()} className="fixed right-4 top-20 z-[100] w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <div className={`px-4 py-3 text-white ${colorClass[presentDetailNode.color]?.header ?? colorClass.blue.header}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider opacity-80">Thông tin chi tiết</p>
                <h3 className="mt-1 truncate text-base font-black">{presentDetailNode.title}</h3>
              </div>
              <button onClick={() => { setPresentDetailNodeId(null); setPresentDetailConnectorId(null); setPresentDetailConnectorSide('single'); }} className="rounded-lg bg-white/15 px-2 py-1 text-xs font-black hover:bg-white/25">×</button>
            </div>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">Mô tả</p>
              <p className="whitespace-pre-wrap text-sm font-semibold text-slate-700">{presentDetailNode.subtitle || 'Chưa có mô tả.'}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-blue-500">Chi tiết</p>
              <div className="text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(presentDetailNode.detail || 'Chưa có thông tin chi tiết.') }} />
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Phụ trách</p>
              <div className="space-y-2">
                {((diagram.assignments[presentDetailNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[]).length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có người phụ trách.</p>}
                {((diagram.assignments[presentDetailNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[]).map(user => <div key={userKey(user)} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
                  {user.picture ? <img src={user.picture} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</div>}
                  <div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{user.name || user.email}</p><p className="truncate text-[11px] font-semibold text-slate-500">{user.role || 'Chưa có vai trò'}</p></div>
                </div>)}
              </div>
              <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Thành viên</p>
              <div className="space-y-2">
                {((diagram.memberAssignments?.[presentDetailNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[]).length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có thành viên.</p>}
                {((diagram.memberAssignments?.[presentDetailNode.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[]).map(user => <div key={userKey(user)} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
                  {user.picture ? <img src={user.picture} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</div>}
                  <div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{user.name || user.email}</p><p className="truncate text-[11px] font-semibold text-slate-500">{user.role || 'Chưa có vai trò'}</p></div>
                </div>)}
              </div>
            </div>
            {(presentDetailNode.linkUrl || presentDetailNode.drillPageId) && <button onClick={() => openNodeLink(presentDetailNode)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"><ExternalLink className="h-4 w-4" /> Mở liên kết</button>}
          </div>
        </aside>}

        {presentDetailConnector && (() => {
          const isForward = presentDetailConnectorSide === 'forward';
          const isBackward = presentDetailConnectorSide === 'backward';
          const noteTitle = isForward ? (presentDetailConnector.forwardLabel || 'Ghi chú') : isBackward ? (presentDetailConnector.backwardLabel || 'Ghi chú 2') : (presentDetailConnector.label || 'Ghi chú');
          const noteDetail = isForward ? (presentDetailConnector.forwardDetail ?? presentDetailConnector.detail) : isBackward ? (presentDetailConnector.backwardDetail ?? '') : presentDetailConnector.detail;
          const fromTitle = diagram.nodes.find(n => n.id === presentDetailConnector.from)?.title || 'A';
          const toTitle = diagram.nodes.find(n => n.id === presentDetailConnector.to)?.title || 'B';
          return <aside onPointerDown={event => event.stopPropagation()} className="fixed right-4 top-20 z-[100] w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
            <div className={`${isBackward ? 'bg-rose-700' : isForward ? 'bg-blue-700' : 'bg-slate-800'} px-4 py-3 text-white`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider opacity-80">Thông tin ghi chú</p>
                  <h3 className="mt-1 truncate text-base font-black">{noteTitle}</h3>
                  <p className="mt-1 truncate text-[11px] font-bold opacity-80">{isBackward ? `${toTitle} → ${fromTitle}` : `${fromTitle} → ${toTitle}`}</p>
                </div>
                <button onClick={() => { setPresentDetailConnectorId(null); setPresentDetailNodeId(null); setPresentDetailConnectorSide('single'); }} className="rounded-lg bg-white/15 px-2 py-1 text-xs font-black hover:bg-white/25">×</button>
              </div>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">Ghi chú</p>
                <p className="whitespace-pre-wrap text-sm font-semibold text-slate-700">{noteTitle || 'Chưa có ghi chú.'}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-blue-500">Chi tiết</p>
                <div className="text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(noteDetail || 'Chưa có thông tin chi tiết.') }} />
              </div>
            </div>
          </aside>;
        })()}
        <div className="border-t border-white/10 bg-slate-950/95 px-5 py-2 text-xs text-white/60">Tip: giữ chuột trái để di chuyển phạm vi trang, lăn chuột để phóng to/thu nhỏ, chuột phải vào khối hoặc ghi chú/mũi tên để xem chi tiết, double-click khối có link/drill-down để mở liên kết.</div>
      </div>
    );
  }

  return (
    <div className={editFullscreen ? 'fixed inset-0 z-50 overflow-hidden bg-slate-50 p-3' : 'pb-10'}>
      {editFullscreen && <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-blue-600">Chế độ sửa toàn trang</p>
          <h2 className="truncate text-lg font-black text-slate-900">{activePage.title}</h2>
        </div>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto px-2">
          {pages.map(page => <button key={page.id} onClick={() => { setActivePageId(page.id); setSelectedId(''); setSelectedIds([]); setSelectedConnectorId(null); }} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${activePageId === page.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Layers className="mr-1 inline h-3.5 w-3.5" />{page.title}</button>)}
        </div>
        <button onClick={savePagesToDatabase} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white ${saveStatus === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}><Save className="h-4 w-4" /> {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu DB' : saveStatus === 'error' ? 'Lưu lỗi' : 'Lưu DB'}</button>
        <button onClick={() => setEditFullscreen(false)} className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">Thoát toàn trang</button>
      </div>}
      {!editFullscreen && <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700"><Building2 className="h-4 w-4" /> Draw.io-lite riêng cho Skymobile</div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Sơ đồ tổ chức & hệ thống</h1>
          <p className="mt-2 max-w-3xl text-slate-600">Canvas, palette, toolbar, inspector, shape library, connector nhiều kiểu, drill-down nhiều trang và lưu database.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode('present')} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"><Eye className="h-4 w-4" /> Xem toàn trang</button>
          <button onClick={() => setEditFullscreen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"><Maximize2 className="h-4 w-4" /> Sửa toàn trang</button>
          <button onClick={addPage} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"><FilePlus2 className="h-4 w-4" /> Thêm sơ đồ mới</button>
          <button onClick={savePagesToDatabase} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${saveStatus === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}><Save className="h-4 w-4" /> {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu DB' : saveStatus === 'error' ? 'Lưu lỗi' : 'Lưu DB'}</button>
          <button onClick={resetLayout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Maximize2 className="h-4 w-4" /> Reset</button>
          <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Export</button>
        </div>
      </header>}

      {!editFullscreen && <div className="mb-3 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
        {pages.map(page => <button key={page.id} onClick={() => { setActivePageId(page.id); setSelectedId(''); setSelectedIds([]); setSelectedConnectorId(null); }} className={`rounded-xl px-4 py-2 text-sm font-bold ${activePageId === page.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Layers className="mr-2 inline h-4 w-4" />{page.title}</button>)}
        <button onClick={addPage} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"><Plus className="h-4 w-4" /> Thêm sơ đồ mới</button>
      </div>}

      <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex items-center gap-1 text-slate-500">
            <button onClick={() => { setTool('select'); setConnectorFrom(null); }} className={`rounded-lg p-2 hover:bg-white ${tool === 'select' ? 'bg-white text-blue-600 shadow-sm' : ''}`}><MousePointer2 className="h-4 w-4" /></button>
            <button onClick={() => { setTool('connector'); setConnectorFrom(null); }} className={`rounded-lg p-2 hover:bg-white ${tool === 'connector' ? 'bg-white text-blue-600 shadow-sm' : ''}`} title="Vẽ mũi tên"><ArrowRight className="h-4 w-4" /></button>
            <select value={connectorKind} onChange={e => setConnectorKind(e.target.value as ConnectorKind)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold"><option value="straight">Straight</option><option value="elbow">Elbow</option><option value="curved">Curved</option></select>
            <select value={arrowKind} onChange={e => setArrowKind(e.target.value as ArrowKind)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold"><option value="one-way">One-way</option><option value="two-way">Two-way</option><option value="none">No arrow</option></select>
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <button onClick={alignSelectionHorizontal} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-black text-slate-600 hover:bg-white" title="Căn ngang: xếp các khối đang chọn thành một hàng ngang; nếu chưa chọn thì căn toàn bộ sơ đồ"><Workflow className="h-4 w-4" /> Căn ngang</button><button onClick={alignSelectionVertical} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-black text-slate-600 hover:bg-white" title="Căn dọc: xếp các khối đang chọn thành một cột dọc; nếu chưa chọn thì căn toàn bộ sơ đồ"><Workflow className="h-4 w-4 rotate-90" /> Căn dọc</button>
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <button onClick={() => setZoom(v => Math.max(0.5, v - 0.1))} className="rounded-lg p-2 hover:bg-white"><ZoomOut className="h-4 w-4" /></button><span className="w-14 text-center text-xs font-bold">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(v => Math.min(1.4, v + 0.1))} className="rounded-lg p-2 hover:bg-white"><ZoomIn className="h-4 w-4" /></button>
          </div>
          <div className="text-xs font-semibold text-slate-500">{tool === 'connector' ? `Chọn điểm đầu${connectorFrom ? ' → chọn điểm cuối' : ''}` : selectedIds.length > 1 ? `${selectedIds.length} khối đang chọn` : `${activePage.description} · Kéo nền để di chuyển màn hình · Ctrl+lăn chuột để zoom · Shift+kéo để chọn nhiều · Ctrl+A chọn tất cả`}</div>
        </div>

        <div className={`grid min-h-0 overflow-hidden ${editFullscreen ? 'h-[calc(100vh-122px)]' : 'h-[780px]'} grid-cols-[270px_1fr_340px]`}>
          <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-4 pb-10">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><GripVertical className="h-4 w-4 text-slate-400" /> Shape library</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {shapeLibrary.map(shape => <button key={shape.kind} onClick={() => addShape(shape)} className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50">{shape.icon}<span className="mt-1 block">{shape.title}</span></button>)}
            </div>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-900"><UserPlus className="h-4 w-4 text-blue-600" /> Danh sách nhân sự</h3>
            <p className="mb-3 text-xs font-semibold text-slate-500">Một nhân sự có thể kéo thả vào nhiều phòng ban/vị trí.</p>
            <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm nhân sự..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" /></div>
            <div onDragOver={e => e.preventDefault()} onDrop={() => { if (dragEmployeeKey) unassignEmployee(dragEmployeeKey); setDragEmployeeKey(null); }} className="h-[395px] space-y-2 overflow-y-auto rounded-2xl border border-dashed border-slate-300 bg-white p-2">
              {loading && <p className="p-3 text-sm text-slate-500">Đang tải nhân sự...</p>}{error && <p className="p-3 text-sm text-rose-600">Lỗi tải nhân sự: {error}</p>}{!loading && filteredUsers.length === 0 && <p className="p-3 text-sm text-slate-500">Không tìm thấy nhân sự phù hợp.</p>}{filteredUsers.map(user => renderEmployeeCard(user))}
            </div>
          </aside>

          <main className="relative overflow-auto bg-slate-100" ref={canvasRef} onContextMenu={e => openContextMenu(e)}>
            <div onPointerDown={startCanvasPointerDown} className={`relative origin-top-left ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ width: canvasSize.width, height: canvasSize.height, transform: `scale(${zoom})`, backgroundImage: 'linear-gradient(#dbe3ef 1px, transparent 1px), linear-gradient(90deg, #dbe3ef 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <svg className="absolute inset-0 h-full w-full">
                <defs><marker id="arrow-end" markerWidth="6" markerHeight="6" refX="5.5" refY="2.5" orient="auto" markerUnits="strokeWidth" viewBox="0 0 6 5"><path d="M0,0 L0,5 L6,2.5 z" fill="#64748b" /></marker><marker id="arrow-start" markerWidth="6" markerHeight="6" refX="0.5" refY="2.5" orient="auto" markerUnits="strokeWidth" viewBox="0 0 6 5"><path d="M6,0 L6,5 L0,2.5 z" fill="#64748b" /></marker></defs>
                {diagram.connectors.map(conn => {
                  const geometry = connectorGeometry(conn);
                  if (!geometry) return null;
                  const stroke = selectedConnectorId === conn.id ? '#2563eb' : '#64748b';
                  return <g key={conn.id} data-connector="true" onClick={() => { setSelectedConnectorId(conn.id); setSelectedId(''); setSelectedIds([]); }} className="cursor-pointer">
                    {conn.arrow === 'two-way' ? <>
                      <path d={geometry.forwardPath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" />
                      <path d={geometry.backwardPath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" />
                      <path d={geometry.forwardPath} fill="none" stroke={stroke} strokeWidth="2" markerEnd="url(#arrow-end)" />
                      <path d={geometry.backwardPath} fill="none" stroke={stroke} strokeWidth="2" markerEnd="url(#arrow-end)" />
                      {conn.forwardLabel && <g><rect x={geometry.labels.forward.x - 58} y={geometry.labels.forward.y - 15} width="116" height="22" rx="8" fill="white" stroke="#bfdbfe" /><text x={geometry.labels.forward.x} y={geometry.labels.forward.y} textAnchor="middle" className="fill-blue-700 text-xs font-bold">{conn.forwardLabel}</text></g>}
                      {conn.backwardLabel && <g><rect x={geometry.labels.backward.x - 58} y={geometry.labels.backward.y - 15} width="116" height="22" rx="8" fill="white" stroke="#fecdd3" /><text x={geometry.labels.backward.x} y={geometry.labels.backward.y} textAnchor="middle" className="fill-rose-700 text-xs font-bold">{conn.backwardLabel}</text></g>}
                    </> : <>
                      <path d={geometry.singlePath} fill="none" stroke="transparent" strokeWidth="18" className="pointer-events-stroke" />
                      <path d={geometry.singlePath} fill="none" stroke={stroke} strokeWidth="2" markerEnd={conn.arrow === 'one-way' ? 'url(#arrow-end)' : undefined} />
                      {conn.label && <g><rect x={geometry.labels.single.x - 58} y={geometry.labels.single.y - 15} width="116" height="22" rx="8" fill="white" stroke="#cbd5e1" /><text x={geometry.labels.single.x} y={geometry.labels.single.y} textAnchor="middle" className="fill-slate-700 text-xs font-bold">{conn.label}</text></g>}
                    </>}
                  </g>;
                })}
              </svg>
              {selectionBox && <div className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />}

              {diagram.nodes.map(node => {
                const colors = colorClass[node.color] ?? colorClass.blue;
                const active = selectedIds.includes(node.id) || selectedId === node.id;
                const locked = Boolean(lockedGroupForNode(node.id));
                const coordinateLocked = isNodeCoordinateLocked(node.id);
                const employees = (diagram.assignments[node.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[];
                const members = (diagram.memberAssignments?.[node.id] ?? []).map(key => usersByKey.get(key)).filter(Boolean) as OrgUser[];
                const box = nodeBox(node);
                return <div key={node.id} data-node-id={node.id} ref={element => { nodeElementRefs.current[node.id] = element; }} onContextMenu={e => openContextMenu(e, node.id)} onPointerDown={e => { if ((e.target as HTMLElement).closest('[data-no-move]')) return; e.stopPropagation(); if (tool === 'connector') { setSelectedIds([]); setSelectedId(node.id); setSelectedConnectorId(null); if (!connectorFrom) setConnectorFrom(node.id); else { addConnector(connectorFrom, node.id); setConnectorFrom(null); setTool('select'); } return; } if (e.ctrlKey || e.metaKey) { if (selectedIds.includes(node.id) && selectedIds.length > 1) startNodeDrag(node, e); else toggleNodeSelection(node.id); return; } setSelectedId(node.id); setSelectedIds([node.id]); setSelectedConnectorId(null); startNodeDrag(node, e); }} onDoubleClick={() => openNodeLink(node)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragEmployeeKey) assignEmployee(dragEmployeeKey, node.id); setDragEmployeeKey(null); }} className={`absolute select-none rounded-2xl border-2 bg-white shadow-lg ${connectorFrom === node.id ? 'border-blue-500 ring-4 ring-blue-300' : active ? `${colors.border} ring-4 ring-blue-200` : coordinateLocked ? 'border-rose-300 ring-2 ring-rose-100' : locked ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200'}`} style={{ left: box.left, top: box.top, width: node.w, minHeight: node.h }}>
                  <div className={`flex cursor-move items-center justify-between gap-3 rounded-t-[0.9rem] px-4 py-3 ${colors.header}`}><div className="flex min-w-0 items-center gap-2">{iconForNode(node)}<h3 className="truncate text-sm font-black">{node.title}</h3></div><div className="flex items-center gap-2">{(node.linkUrl || node.drillPageId) && <ExternalLink data-no-move onClick={() => openNodeLink(node)} className="h-4 w-4 cursor-pointer opacity-80" />}{coordinateLocked ? <span title="Đã khoá toạ độ" className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-black">LOCK</span> : <GripVertical className="h-4 w-4 opacity-70" />}</div></div>
                  <div className="p-4"><p className="mb-3 text-xs font-medium text-slate-500">{node.subtitle}</p><div className="mb-3 grid grid-cols-2 gap-2 text-xs font-bold"><div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700"><span className="flex items-center justify-between gap-1"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Phụ trách</span><span>{employees.length}</span></span></div><div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600"><span className="flex items-center justify-between gap-1"><span>Thành viên</span><span>{members.length}</span></span></div></div>{employees.length > 0 && <div className="mb-2 space-y-1.5">{employees.slice(0, 2).map(user => <div key={userKey(user)} data-no-move draggable onDragStart={() => setDragEmployeeKey(userKey(user))} onDragEnd={() => setDragEmployeeKey(null)} className="flex cursor-grab items-center gap-2 rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700"><span className={`h-2 w-2 rounded-full ${colors.dot}`} /><span className="truncate">{user.name || user.email}</span></div>)}{employees.length > 2 && <p className="text-[11px] font-bold text-blue-400">+{employees.length - 2} phụ trách khác</p>}</div>}{members.length > 0 && <div className="space-y-1.5">{members.slice(0, 2).map(user => <div key={userKey(user)} data-no-move draggable onDragStart={() => setDragEmployeeKey(userKey(user))} onDragEnd={() => setDragEmployeeKey(null)} className="flex cursor-grab items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700"><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="truncate">{user.name || user.email}</span></div>)}{members.length > 2 && <p className="text-[11px] font-bold text-slate-400">+{members.length - 2} thành viên khác</p>}</div>}</div>
                </div>;
              })}
            </div>
            {contextMenu && <div onClick={e => e.stopPropagation()} className="fixed z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-2xl" style={{ left: contextMenu.screenX, top: contextMenu.screenY }}>
              <div className="border-b border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-400">Tuỳ chọn</div>
              <button onClick={lockSelectedGroup} disabled={selectedIds.length < 2} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300">Khoá các khối được chọn lại với nhau</button>
              <button onClick={unlockContextGroup} disabled={!contextMenu.nodeId || !lockedGroupForNode(contextMenu.nodeId)} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:text-slate-300">Mở khoá nhóm của khối này</button>
              <button onClick={() => { alignSelectionHorizontal(); setContextMenu(null); }} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-slate-50">Căn ngang</button>
              <button onClick={() => { alignSelectionVertical(); setContextMenu(null); }} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-slate-50">Căn dọc</button>
              {contextMenu.nodeId && <button onClick={toggleContextNodeCoordinateLock} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-rose-50">{isNodeCoordinateLocked(contextMenu.nodeId) ? 'Mở khoá toạ độ khối này' : 'Khoá toạ độ khối này'}</button>}
              <button onClick={() => { distributeSelectionHorizontal(); setContextMenu(null); }} disabled={selectedIds.length < 3} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300">Căn đều ngang</button>
              <button onClick={() => { distributeSelectionVertical(); setContextMenu(null); }} disabled={selectedIds.length < 3} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300">Căn đều dọc</button>
              <div className="my-1 border-t border-slate-100" />
              <button onClick={copySelectedNodes} disabled={selectedIds.length === 0 && !contextMenu.nodeId} className="block w-full px-4 py-2 text-left font-bold text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-300">Sao chép</button>
            </div>}
          </main>

          <aside className="min-h-0 overflow-y-auto overscroll-contain border-l border-slate-200 bg-white p-5 pb-28">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Inspector</p><h3 className="mt-1 text-lg font-black text-slate-900">{selectedConnector ? 'Mũi tên' : selectedIds.length > 1 ? `${selectedIds.length} khối đang chọn` : selectedNode?.title || 'Chưa chọn'}</h3></div><Eye className="h-5 w-5 text-slate-400" /></div>
            {selectedIds.length > 1 && !selectedConnector && <div className="mb-4 rounded-2xl bg-violet-50 p-3 text-xs font-bold text-violet-700">Ctrl-kéo một khối trong selection để di chuyển cả nhóm. Shift+kéo trên nền để chọn nhiều. Chuột phải để khoá nhóm.</div>}
            {selectedConnector && <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                {diagram.nodes.find(n => n.id === selectedConnector.from)?.title} ↔ {diagram.nodes.find(n => n.id === selectedConnector.to)?.title}
              </div>
              <label className="text-xs font-black uppercase text-slate-500">Kiểu đường</label>
              <select value={selectedConnector.kind} onChange={e => updateSelectedConnector({ kind: e.target.value as ConnectorKind })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="straight">Straight</option><option value="elbow">Elbow</option><option value="curved">Curved</option></select>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="mb-2 flex items-center justify-between"><label className="text-xs font-black uppercase text-blue-700">Chỉnh đường đi</label><button onClick={() => updateSelectedConnector({ routeMode: 'auto', bend: 0 })} className="text-[11px] font-black text-blue-600 hover:text-blue-800">Reset route</button></div>
                <select value={selectedConnector.routeMode ?? 'auto'} onChange={e => updateSelectedConnector({ routeMode: e.target.value as ConnectorRouteMode })} className="mb-3 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm">
                  <option value="auto">Tự động</option>
                  <option value="horizontal">Bẻ ngang trước / né trái-phải</option>
                  <option value="vertical">Bẻ dọc trước / né trên-dưới</option>
                </select>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateSelectedConnector({ bend: Math.max(-500, (selectedConnector.bend ?? 0) - 24) })} className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600 shadow-sm">−</button>
                  <input type="range" min="-500" max="500" step="12" value={selectedConnector.bend ?? 0} onChange={e => updateSelectedConnector({ bend: Number(e.target.value) })} className="w-full" />
                  <button onClick={() => updateSelectedConnector({ bend: Math.min(500, (selectedConnector.bend ?? 0) + 24) })} className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600 shadow-sm">+</button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Trị số</span>
                  <input type="number" min="-500" max="500" step="12" value={selectedConnector.bend ?? 0} onChange={e => updateSelectedConnector({ bend: Math.max(-500, Math.min(500, Number(e.target.value) || 0)) })} className="w-24 rounded-lg border border-blue-100 px-2 py-1 text-center text-sm font-black text-slate-700 outline-none focus:border-blue-400" />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-blue-700/80">Dùng thanh này để đẩy điểm gập của mũi tên, ví dụ đẩy đường CEO → KD-MKT lên/trái để không nằm dưới Phòng Truyền thông.</p>
              </div>
              <label className="text-xs font-black uppercase text-slate-500">Loại mũi tên</label>
              <select value={selectedConnector.arrow} onChange={e => updateSelectedConnector({ arrow: e.target.value as ArrowKind })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="one-way">Một chiều</option><option value="two-way">Hai chiều</option><option value="none">Không mũi tên</option></select>
              {selectedConnector.arrow === 'two-way' ? <>
                <label className="text-xs font-black uppercase text-blue-600">Ghi chú</label>
                <input value={selectedConnector.forwardLabel ?? ''} onChange={e => updateSelectedConnector({ forwardLabel: e.target.value })} placeholder={`${diagram.nodes.find(n => n.id === selectedConnector.from)?.title || 'A'} → ${diagram.nodes.find(n => n.id === selectedConnector.to)?.title || 'B'}`} className="w-full rounded-xl border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                <div className="flex items-center justify-between gap-2"><label className="text-xs font-black uppercase text-blue-600">Chi tiết ghi chú chiều đi</label><span className="text-[11px] font-semibold text-slate-400">Chọn chữ rồi bấm định dạng</span></div>
                <div className="overflow-hidden rounded-xl border border-blue-200 bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-blue-100 bg-blue-50 px-2 py-2"><button type="button" onClick={() => applyConnectorDetailFormat('forwardDetail', connectorForwardDetailTextareaRef, '**', '**', 'in đậm')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">B</button><button type="button" onClick={() => applyConnectorDetailFormat('forwardDetail', connectorForwardDetailTextareaRef, '*', '*', 'in nghiêng')} className="rounded-lg px-2 py-1 text-xs font-black italic text-slate-700 hover:bg-white">I</button><button type="button" onClick={() => applyConnectorDetailFormat('forwardDetail', connectorForwardDetailTextareaRef, '__', '__', 'gạch chân')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 underline hover:bg-white">U</button><button type="button" onClick={() => applyConnectorDetailFormat('forwardDetail', connectorForwardDetailTextareaRef, '~~', '~~', 'gạch ngang')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 line-through hover:bg-white">S</button><button type="button" onClick={() => insertConnectorDetailBullet('forwardDetail', connectorForwardDetailTextareaRef)} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">• List</button></div><textarea ref={connectorForwardDetailTextareaRef} value={selectedConnector.forwardDetail ?? selectedConnector.detail ?? ''} onChange={e => updateSelectedConnector({ forwardDetail: e.target.value })} placeholder="Nhập thông tin chi tiết riêng cho ghi chú chiều đi..." className="h-24 w-full resize-y px-3 py-2 text-sm outline-none" /></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Xem trước ghi chú</p><div className="max-h-24 overflow-y-auto text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedConnector.forwardDetail || selectedConnector.detail || 'Chưa có thông tin chi tiết.') }} /></div>
                <label className="text-xs font-black uppercase text-rose-600">Ghi chú 2</label>
                <input value={selectedConnector.backwardLabel ?? ''} onChange={e => updateSelectedConnector({ backwardLabel: e.target.value })} placeholder={`${diagram.nodes.find(n => n.id === selectedConnector.to)?.title || 'B'} → ${diagram.nodes.find(n => n.id === selectedConnector.from)?.title || 'A'}`} className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
                <div className="flex items-center justify-between gap-2"><label className="text-xs font-black uppercase text-rose-600">Chi tiết ghi chú chiều về</label><span className="text-[11px] font-semibold text-slate-400">Chọn chữ rồi bấm định dạng</span></div>
                <div className="overflow-hidden rounded-xl border border-rose-200 bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-rose-100 bg-rose-50 px-2 py-2"><button type="button" onClick={() => applyConnectorDetailFormat('backwardDetail', connectorBackwardDetailTextareaRef, '**', '**', 'in đậm')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">B</button><button type="button" onClick={() => applyConnectorDetailFormat('backwardDetail', connectorBackwardDetailTextareaRef, '*', '*', 'in nghiêng')} className="rounded-lg px-2 py-1 text-xs font-black italic text-slate-700 hover:bg-white">I</button><button type="button" onClick={() => applyConnectorDetailFormat('backwardDetail', connectorBackwardDetailTextareaRef, '__', '__', 'gạch chân')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 underline hover:bg-white">U</button><button type="button" onClick={() => applyConnectorDetailFormat('backwardDetail', connectorBackwardDetailTextareaRef, '~~', '~~', 'gạch ngang')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 line-through hover:bg-white">S</button><button type="button" onClick={() => insertConnectorDetailBullet('backwardDetail', connectorBackwardDetailTextareaRef)} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">• List</button></div><textarea ref={connectorBackwardDetailTextareaRef} value={selectedConnector.backwardDetail ?? ''} onChange={e => updateSelectedConnector({ backwardDetail: e.target.value })} placeholder="Nhập thông tin chi tiết riêng cho ghi chú chiều về..." className="h-24 w-full resize-y px-3 py-2 text-sm outline-none" /></div>
                <div className="rounded-xl bg-rose-50 p-3"><p className="mb-2 text-[11px] font-black uppercase tracking-wider text-rose-500">Xem trước ghi chú 2</p><div className="max-h-24 overflow-y-auto text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedConnector.backwardDetail || 'Chưa có thông tin chi tiết.') }} /></div>
              </> : <>
                <label className="text-xs font-black uppercase text-slate-500">Ghi chú</label>
                <input value={selectedConnector.label ?? ''} onChange={e => updateSelectedConnector({ label: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                <div className="flex items-center justify-between gap-2"><label className="text-xs font-black uppercase text-slate-500">Chi tiết ghi chú</label><span className="text-[11px] font-semibold text-slate-400">Chọn chữ rồi bấm định dạng</span></div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-2"><button type="button" onClick={() => applyConnectorDetailFormat('detail', connectorSingleDetailTextareaRef, '**', '**', 'in đậm')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">B</button><button type="button" onClick={() => applyConnectorDetailFormat('detail', connectorSingleDetailTextareaRef, '*', '*', 'in nghiêng')} className="rounded-lg px-2 py-1 text-xs font-black italic text-slate-700 hover:bg-white">I</button><button type="button" onClick={() => applyConnectorDetailFormat('detail', connectorSingleDetailTextareaRef, '__', '__', 'gạch chân')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 underline hover:bg-white">U</button><button type="button" onClick={() => applyConnectorDetailFormat('detail', connectorSingleDetailTextareaRef, '~~', '~~', 'gạch ngang')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 line-through hover:bg-white">S</button><button type="button" onClick={() => insertConnectorDetailBullet('detail', connectorSingleDetailTextareaRef)} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">• List</button></div><textarea ref={connectorSingleDetailTextareaRef} value={selectedConnector.detail ?? ''} onChange={e => updateSelectedConnector({ detail: e.target.value })} placeholder="Nhập thông tin chi tiết cho ghi chú/mũi tên..." className="h-28 w-full resize-y px-3 py-2 text-sm outline-none" /></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Xem trước</p><div className="max-h-28 overflow-y-auto text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedConnector.detail || 'Chưa có thông tin chi tiết.') }} /></div>
              </>}
              <button onClick={deleteSelected} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Xóa mũi tên</button>
            </div>}
            {selectedNode && <div className="space-y-4"><div className={`rounded-2xl p-4 ${colorClass[selectedNode.color]?.soft ?? colorClass.blue.soft}`}><p className="text-sm font-bold">{selectedNode.kind}</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[11px] font-black uppercase tracking-wider opacity-80">X<input type="number" value={Math.round(selectedNode.x)} onChange={e => updateSelectedNode({ x: Number(e.target.value) || 0 })} onPointerDown={e => e.stopPropagation()} onWheel={e => e.currentTarget.blur()} className="mt-1 w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-blue-400 focus:bg-white" /></label><label className="text-[11px] font-black uppercase tracking-wider opacity-80">Y<input type="number" value={Math.round(selectedNode.y)} onChange={e => updateSelectedNode({ y: Number(e.target.value) || 0 })} onPointerDown={e => e.stopPropagation()} onWheel={e => e.currentTarget.blur()} className="mt-1 w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-blue-400 focus:bg-white" /></label></div></div><label className="text-xs font-black uppercase text-slate-500">Tên khối</label><input value={selectedNode.title} onChange={e => updateSelectedNode({ title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-blue-400" /><label className="text-xs font-black uppercase text-slate-500">Mô tả</label><textarea value={selectedNode.subtitle} onChange={e => updateSelectedNode({ subtitle: e.target.value })} className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /><div className="flex items-center justify-between gap-2"><label className="text-xs font-black uppercase text-slate-500">Chi tiết</label><span className="text-[11px] font-semibold text-slate-400">Chọn chữ rồi bấm định dạng</span></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-2"><button type="button" onClick={() => applyDetailFormat('**', '**', 'in đậm')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">B</button><button type="button" onClick={() => applyDetailFormat('*', '*', 'in nghiêng')} className="rounded-lg px-2 py-1 text-xs font-black italic text-slate-700 hover:bg-white">I</button><button type="button" onClick={() => applyDetailFormat('__', '__', 'gạch chân')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 underline hover:bg-white">U</button><button type="button" onClick={() => applyDetailFormat('~~', '~~', 'gạch ngang')} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 line-through hover:bg-white">S</button><button type="button" onClick={insertDetailBullet} className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-white">• List</button></div><textarea ref={detailTextareaRef} value={selectedNode.detail ?? ''} onChange={e => updateSelectedNode({ detail: e.target.value })} placeholder="Nhập thông tin chi tiết hiển thị khi chuột phải trong chế độ xem..." className="h-28 w-full resize-y px-3 py-2 text-sm outline-none" /></div><div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Xem trước</p><div className="max-h-28 overflow-y-auto text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedNode.detail || 'Chưa có thông tin chi tiết.') }} /></div><label className="text-xs font-black uppercase text-slate-500">Link ngoài / route nội bộ</label><input value={selectedNode.linkUrl ?? ''} onChange={e => updateSelectedNode({ linkUrl: e.target.value })} placeholder="https://... hoặc /..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /><label className="text-xs font-black uppercase text-slate-500">Drill-down sang trang sơ đồ</label><select value={selectedNode.drillPageId ?? ''} onChange={e => updateSelectedNode({ drillPageId: e.target.value || undefined })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Không liên kết trang</option>{pages.filter(p => p.id !== activePageId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>{(selectedNode.linkUrl || selectedNode.drillPageId) && <button onClick={() => openNodeLink(selectedNode)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700"><ExternalLink className="h-4 w-4" /> Mở liên kết</button>}<div className="space-y-3"><div onDragOver={e => e.preventDefault()} onDrop={() => { if (dragEmployeeKey) assignEmployee(dragEmployeeKey, selectedNode.id, 'owner'); setDragEmployeeKey(null); }} className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-3"><h4 className="mb-2 text-sm font-black text-blue-800">Phụ trách</h4><div className="max-h-44 space-y-2 overflow-y-auto">{selectedEmployees.length === 0 && <p className="rounded-xl bg-white/70 p-3 text-sm text-blue-600">Kéo nhân sự vào đây để gán người phụ trách.</p>}{selectedEmployees.map(user => renderEmployeeCard(user, { assignedDeptId: selectedNode.id, role: 'owner' }))}</div></div><div onDragOver={e => e.preventDefault()} onDrop={() => { if (dragEmployeeKey) assignEmployee(dragEmployeeKey, selectedNode.id, 'member'); setDragEmployeeKey(null); }} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3"><h4 className="mb-2 text-sm font-black text-slate-800">Thành viên</h4><div className="max-h-44 space-y-2 overflow-y-auto">{selectedMembers.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Kéo nhân sự vào đây để gán thành viên.</p>}{selectedMembers.map(user => renderEmployeeCard(user, { assignedDeptId: selectedNode.id, role: 'member' }))}</div></div></div>{selectedNode.kind !== 'ceo' && <button onClick={deleteSelected} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Xóa khối</button>}</div>}
            {!selectedNode && !selectedConnector && <div className="space-y-4"><div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700"><p className="font-black">Thông tin sơ đồ hiện tại</p><p className="mt-1 text-xs">Có thể đổi tên/mô tả sơ đồ rồi bấm Lưu DB.</p></div><label className="text-xs font-black uppercase text-slate-500">Tên sơ đồ</label><input value={activePage.title} onChange={e => updateActivePageMeta({ title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-blue-400" /><label className="text-xs font-black uppercase text-slate-500">Mô tả sơ đồ</label><textarea value={activePage.description} onChange={e => updateActivePageMeta({ description: e.target.value })} className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /><button onClick={addPage} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Thêm sơ đồ mới</button></div>}
          </aside>
        </div>
      </div>
    </div>
  );
};
