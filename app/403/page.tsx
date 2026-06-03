import { ErrorState } from '@/components/common/error-state';

export default function ForbiddenPage() {
  return (
    <ErrorState
      minH="100vh"
      eyebrow="403"
      title="你没有权限访问该页面"
      status="warning"
      description="如果你认为这是误判，请联系管理员检查角色和权限配置。"
      actions={[{ label: '返回首页', href: '/' }]}
    />
  );
}
