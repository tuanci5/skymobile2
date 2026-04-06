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
import { headRole } from './positions/head/role';
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
  'ops': opsJD
};

export const ROLES: Role[] = [
  headRole,
  // Add other roles...
];
