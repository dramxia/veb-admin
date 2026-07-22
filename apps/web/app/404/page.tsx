import { ErrorState } from '@/components/common/error-state';

export default function NotFoundPage() {
  return (
    <ErrorState
      minH="100vh"
      eyebrow="404"
      title="页面不存在"
      status="info"
      description="当前地址没有匹配到可访问页面，可能是菜单路径或动态模块配置不正确。"
      actions={[{ label: '返回首页', href: '/' }]}
    />
  );
}
