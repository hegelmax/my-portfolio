import React, { useEffect, useState } from "react";

import './Blog.scss';

type BlogItem = {
  id: number;
  title: string;
  slug: string;
  intro: string;
  image: string;
  category: string;
  created: string;
  author: string;
};

type BlogResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: BlogItem[];
};

const Blog: React.FC = () => {
  const [data, setData] = useState<BlogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const pageSize = 5;

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`https://paley.hgl.mx/api/blog/?page=${page}&limit=${pageSize}`);
        const json = await resp.json();
        setData(json);
      } catch (e) {
        console.error("Blog load error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (!data) return;
    if (newPage < 1 || newPage > data.totalPages) return;
    setPage(newPage);
  };

  return (
    <main className="page page--blog">
      <div className="container container--narrow">
        <header className="blog-header">
          <h1 className="blog-header__title">Blog</h1>
          <p className="blog-header__intro">
            Thoughts on womenswear, silhouettes and real-life wardrobes — from studio notes 
            to show impressions and styling ideas.
          </p>
        </header>

        {loading && <p className="blog-loading">Loading…</p>}

        {!loading && data && (
          <>
            <section className="blog-list">
              {data.items.map((item) => (
                <article key={item.id} className="blog-card">
                  {item.image && (
                    <div className="blog-card__image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}

                  <div className="blog-card__content">
                    <h2 className="blog-card__title">{item.title}</h2>
                    <div className="blog-card__meta">
                      <span className="blog-card__author">
                        by {item.author}
                      </span>
                      <span className="blog-card__separator">—</span>
                      <span className="blog-card__category">
                        {item.category}
                      </span>
                      <span className="blog-card__separator">—</span>
                      <span className="blog-card__date">
                        {item.created}
                      </span>
                    </div>
                    <p className="blog-card__intro">{item.intro}</p>
                    <a
                      href={`https://renew.style/blog/${item.id}-${item.slug}`}
                      className="blog-card__readmore"
                    >
                      Read More
                    </a>
                  </div>
                </article>
              ))}
            </section>

            {/* Пагинация */}
            {data.totalPages > 1 && (
              <nav className="blog-pagination">
                <button
                  className="blog-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>

                <div className="blog-pagination__pages">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        className={
                          "blog-pagination__page" +
                          (p === page ? " blog-pagination__page--active" : "")
                        }
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  className="blog-pagination__btn"
                  disabled={page >= data.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Blog;

