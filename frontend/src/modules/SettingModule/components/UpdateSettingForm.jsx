import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';

import { Button, Form } from 'antd';
import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';
import { notification } from 'antd';

export default function UpdateSettingForm({ config, children, withUpload, uploadSettingKey }) {
  let { entity, settingsCategory } = config;
  const dispatch = useDispatch();
  const { result, isLoading } = useSelector(selectSettings);
  const translate = useLanguage();
  const [form] = Form.useForm();

  const onSubmit = (fieldsValue) => {
    if (withUpload) {
      const fileList = fieldsValue.file;
      if (fileList && fileList.length > 0) {
        const fileItem = fileList[0];
        // When `beforeUpload` returns false, antd keeps the raw File on
        // `originFileObj`; some flows hand back the File itself — support both.
        const fileToUpload = fileItem.originFileObj || fileItem;
        fieldsValue.file = fileToUpload;
      } else {
        notification.error({
          message: translate('Please select a file to upload.'),
        });
        return;
      }
      dispatch(
        settingsAction.upload({ entity, settingKey: uploadSettingKey, jsonData: fieldsValue })
      );
    } else {
      const settings = [];

      for (const [key, value] of Object.entries(fieldsValue)) {
        settings.push({ settingKey: key, settingValue: value });
      }

      dispatch(settingsAction.updateMany({ entity, jsonData: { settings } }));
    }
  };




  useEffect(() => {
    const current = result[settingsCategory];

    form.setFieldsValue(current);
  }, [result]);

  return (
    <div>
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          onFinish={onSubmit}
          // onValuesChange={handleValuesChange}
          labelCol={{ span: 10 }}
          labelAlign="left"
          wrapperCol={{ span: 16 }}
        >
          {children}
          <Form.Item
            style={{
              display: 'inline-block',
              paddingRight: '5px',
            }}
          >
            <Button type="primary" htmlType="submit">
              {translate('Save')}
            </Button>
          </Form.Item>
          <Form.Item
            style={{
              display: 'inline-block',
              paddingLeft: '5px',
            }}
          >
            {/* <Button onClick={() => console.log('Cancel clicked')}>{translate('Cancel')}</Button> */}
          </Form.Item>
        </Form>
      </Loading>
    </div>
  );
}
