import { ErpLayout } from '@/layout';

import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Payment from './components/Payment';

export default function RecordPaymentModule({ config }) {
  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    // Always reload the invoice so its credit reflects payments just recorded.
    dispatch(erp.currentItem({ data: {} }));
    dispatch(erp.read({ entity: config.entity, id }));
  }, [dispatch, config.entity, id]);

  const { result: currentResult } = useSelector(selectCurrentItem);
  const item = currentResult?._id === id ? currentResult : null;

  useEffect(() => {
    if (item) {
      dispatch(erp.currentAction({ actionType: 'recordPayment', data: item }));
    }
  }, [dispatch, item]);

  return (
    <ErpLayout>
      {item ? <Payment config={config} currentItem={currentResult} /> : <PageLoader />}
    </ErpLayout>
  );
}
