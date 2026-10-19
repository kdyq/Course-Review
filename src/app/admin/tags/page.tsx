import { TagForm } from "@/components/admin/TagForm";
import { TagToggleButton } from "@/components/admin/TagToggleButton";
import { formatDate } from "@/lib/format";
import { getAdminTags } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAdminTags();

  return (
    <>
      <h1 className="admin-title">标签管理</h1>

      <div className="zine-card zine-card--pad">
        <h2>新建标签</h2>
        <TagForm />
      </div>

      <div className="table-wrap section-action">
        <table className="data-table">
          <thead>
            <tr>
              <th>标签</th>
              <th>Slug</th>
              <th>状态</th>
              <th>评价数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>
                  <details>
                    <summary>{tag.name}</summary>
                    <div className="section-action">
                      <TagForm
                        initial={{
                          id: tag.id,
                          name: tag.name,
                          isActive: tag.isActive,
                        }}
                        compact
                      />
                    </div>
                  </details>
                </td>
                <td className="mono">{tag.slug}</td>
                <td>{tag.isActive ? "启用" : "停用"}</td>
                <td>{tag.reviewCount}</td>
                <td>{formatDate(tag.createdAt)}</td>
                <td>
                  <TagToggleButton id={tag.id} isActive={tag.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tags.length === 0 ? <p className="muted">还没有标签。</p> : null}
    </>
  );
}
