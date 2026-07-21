import React from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber } from 'antd';
import { DatePicker } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import { useMoney, useDate } from '@/settings';

import useLanguage from '@/locale/useLanguage';

export default function PaymentForm({ maxAmount = null, isUpdateForm = false }) {
  const translate = useLanguage();
  const { TextArea } = Input;
  const money = useMoney();
  const { dateFormat } = useDate();
  return (
    <>
      <Form.Item
        label={translate('number')}
        name="number"
        initialValue={1}
        rules={[
          {
            required: true,
          },
        ]}
        style={{ width: '50%', float: 'left', paddingRight: '20px' }}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="date"
        label={translate('date')}
        rules={[
          {
            required: true,
            type: 'object',
          },
        ]}
        initialValue={dayjs()}
        style={{ width: '100%' }}
      >
        <DatePicker format={dateFormat} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label={translate('amount')}
        name="amount"
        validateTrigger="onSubmit"
        rules={[
          { required: true },
          {
            validator: (_, value) => {
              if (value === undefined || value === null || maxAmount === null || value <= maxAmount) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(translate('amount_exceeds_remaining')));
            },
          },
        ]}
      >
        <InputNumber
          className="moneyInput"
          min={0}
          controls={false}
          addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
          addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
        />
      </Form.Item>
      <Form.Item
        label={translate('payment_mode')}
        name="paymentMode"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <SelectAsync
          entity={'paymentMode'}
          displayLabels={['name']}
          withRedirect={true}
          urlToRedirect="/payment/mode"
          redirectLabel="Add Payment Mode"
          autoSelectDefault={true}
        ></SelectAsync>
      </Form.Item>
      <Form.Item label={translate('Reference')} name="ref">
        <Input />
      </Form.Item>
      <Form.Item label={translate('Description')} name="description">
        <TextArea />
      </Form.Item>
    </>
  );
}
