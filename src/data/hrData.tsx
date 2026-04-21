import { JobDescription, Role } from '../types';
import { headJD } from './positions/head/jd';
import { mktLeadJD } from './positions/mkt_lead/jd';
import { saleLeadJD } from './positions/sale_lead/jd';
import { cskhLeadJD } from './positions/cskh_lead/jd';
import { saleStaffJD } from './positions/sale_staff/jd';
import { cskhStaffJD } from './positions/cskh_staff/jd';
import { mktAdsJD } from './positions/mkt_ads/jd';
import { mktContentJD } from './positions/mkt_content/jd';
import { mktMediaJD } from './positions/mkt_media/jd';
import { telesaleJD } from './positions/telesale/jd';
import { crmJD } from './positions/crm/jd';
import { opsJD } from './positions/ops/jd';
import { accountantJD } from './positions/accountant/jd';
import { headRole } from './positions/head/role';
import { accountantRole } from './positions/accountant/role';
import { hrStaffJD } from './positions/hr_staff/jd';
import { hrStaffRole } from './positions/hr_staff/role';
import { jpSupportAfterSalesJD } from './positions/jp_support_after_sales/jd';
import { jpSupportAfterSalesRole } from './positions/jp_support_after_sales/role';
// Import other roles similarly...

export const JD_DATA: Record<string, JobDescription> = {
  'head': headJD,
  'mkt_lead': mktLeadJD,
  'sale_lead': saleLeadJD,
  'cskh_lead': cskhLeadJD,
  'sale_staff': saleStaffJD,
  'cskh_staff': cskhStaffJD,
  'mkt_ads': mktAdsJD,
  'mkt_content': mktContentJD,
  'mkt_media': mktMediaJD,
  'telesale': telesaleJD,
  'crm': crmJD,
  'ops': opsJD,
  'accountant': accountantJD,
  'hr_staff': hrStaffJD,
  'jp_support_after_sales': jpSupportAfterSalesJD
};

export const ROLES: Role[] = [
  headRole,
  accountantRole,
  hrStaffRole,
  jpSupportAfterSalesRole,
  // Add other roles...
];
