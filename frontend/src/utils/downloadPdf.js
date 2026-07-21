import axios from 'axios';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

export default async function downloadPdf(entity, record) {
  const token = storePersist.get('auth')?.current?.token;
  if (!token) throw new Error('Please log in before downloading documents.');

  const response = await axios.get(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${entity}-${record.number || record._id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
