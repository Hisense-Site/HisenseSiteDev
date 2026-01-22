function applyAggregatedSort(sortProperty, direction = -1) {
  try {
    // 如果有筛选结果，就在筛选结果基础上排序，否则使用原始数据进行排序
    let listToSort;
    if (Array.isArray(window.filteredProducts) && window.filteredProducts.length > 0) {
      // 使用当前筛选结果进行排序
      listToSort = window.filteredProducts.slice();
    } else if (Array.isArray(window.productData)) {
      // 使用全部产品数据进行排序
      listToSort = window.productData.slice();
    } else {
      listToSort = [];
    }
    if (!listToSort || !listToSort.length) {
      return;
    }

    // 通过 key 获取 product model 的属性
    const getPropertyByKey = (item, propKey) => {
      if (!item || !propKey) return undefined;
      if (Object.prototype.hasOwnProperty.call(item, propKey)) return item[propKey];
      const parts = propKey.includes('.') ? propKey.split('.') : propKey.split('_');
      return parts.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), item);
    };

    // 序列化属性，排序属性的值类型中包含尺寸，时间，价格，文本
    const normalizeValueForSort = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value)) {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? String(value).toLowerCase() : parsed;
      }
      if (typeof value === 'string' && sortProperty.toLowerCase().includes('size')) {
        const m = value.match(/(\d+(\.\d+)?)/);
        if (m) return parseFloat(m[1]);
      }
      return String(value).toLowerCase();
    };

    // 按 factoryModel 分组，计算每个组在指定属性上的最大值
    const groupedByFactoryModel = {};
    const factoryModelMaxValues = {};

    listToSort.forEach((item) => {
      const { factoryModel } = item;
      if (!groupedByFactoryModel[factoryModel]) {
        groupedByFactoryModel[factoryModel] = [];
      }
      groupedByFactoryModel[factoryModel].push(item);

      // 计算该 factoryModel 在指定属性上的最大值
      const value = normalizeValueForSort(getPropertyByKey(item, sortProperty));
      if (value !== null && value !== undefined) {
        if (!factoryModelMaxValues[factoryModel]
            || (typeof value === 'number' && typeof factoryModelMaxValues[factoryModel] === 'number' && value > factoryModelMaxValues[factoryModel])
            || (typeof value === 'string' && typeof factoryModelMaxValues[factoryModel] === 'string' && String(value).localeCompare(String(factoryModelMaxValues[factoryModel])) > 0)) {
          factoryModelMaxValues[factoryModel] = value;
        }
      }
    });

    const getProductSeries = (item) => {
      if (!item) return '';
      if (item.series) return item.series;
      return item.sku || '';
    };

    // 按最大值进行排序，当最大值相同时按标题Z-A排序
    const sortedProducts = listToSort.slice().sort((a, b) => {
      const maxValueA = factoryModelMaxValues[a.factoryModel];
      const maxValueB = factoryModelMaxValues[b.factoryModel];

      // 处理空值情况
      if (maxValueA === null || maxValueA === undefined) return 1 * direction;
      if (maxValueB === null || maxValueB === undefined) return -1 * direction;

      // 比较最大值
      let compareResult = 0;
      if (maxValueA === maxValueB) {
        // 先按数字9-0排序，再按字母Z-A排序
        const titleA = getProductSeries(a);
        const titleB = getProductSeries(b);

        // 先按数字9-0
        const numA = parseFloat(titleA.replace(/[^\d.]/g, '')) || 0;
        const numB = parseFloat(titleB.replace(/[^\d.]/g, '')) || 0;
        const numCompare = numB - numA; // 9-0排序，数字大的在前

        if (numCompare !== 0) {
          compareResult = numCompare;
        } else {
          // 数字相同，按字母Z-A排序
          compareResult = String(titleB).localeCompare(String(titleA));
        }
      } else if (typeof maxValueA === 'number' && typeof maxValueB === 'number') {
        compareResult = (maxValueA - maxValueB) * direction;
      } else {
        compareResult = String(maxValueA).localeCompare(String(maxValueB)) * direction;
      }

      return compareResult;
    });

    // 如果是按尺寸排序，设置标志表示产品卡片应默认选中最大尺寸
    if (!sortProperty || sortProperty === 'size') {
      window.isDefaultSortApplied = true;
    } else {
      window.isDefaultSortApplied = false;
    }

    window.renderPlpProducts(sortedProducts);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('Aggregated sort error:', e);
  }
}

export default function decorate(block) {
  const isEditMode = block && block.hasAttribute && block.hasAttribute('data-aue-resource');

  const rows = [...(block.children || [])];
  let graphqlUrl = null;
  let graphqlResource = null;
  let fields = [];
  let fieldsResource = null;
  let loadMoreTextContent = null;
  let loadMoreLink = null;
  let noResultMessage = null;

  rows.forEach((row, index) => {
    const resource = row.getAttribute && row.getAttribute('data-aue-resource');
    const anchor = row.querySelector && row.querySelector('a');
    const text = row.textContent && row.textContent.trim();

    if (index === 0) {
      // 第一行：graphqlUrl
      if (anchor) {
        graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
        graphqlResource = resource || anchor.getAttribute('data-aue-resource') || null;
      } else if (text) {
        graphqlUrl = text;
        graphqlResource = resource;
      }
    } else if (index === 1) {
      // 第二行：fields
      if (text && text.indexOf(',') >= 0) {
        fields = text.split(',').map((s) => s.trim()).filter(Boolean);
        fieldsResource = resource;
      }
    } else if (index === 2) {
      // 第三行：loadMoreTextContent
      if (text) {
        loadMoreTextContent = text;
      }
    } else if (index === 3) {
      // 第四行：loadMoreLink
      if (anchor) {
        loadMoreLink = anchor.getAttribute('href') || anchor.textContent.trim();
      } else if (text) {
        loadMoreLink = text;
      }
    } else if (index === 4) {
      // 第五行：noResultMessage
      if (text) {
        noResultMessage = row.innerHTML;
      }
    }
  });

  rows.forEach((row) => {
    if (row && row.parentNode) row.parentNode.removeChild(row);
  });

  const productsBox = document.createElement('div');
  productsBox.className = 'plp-products-box';
  const productsGrid = document.createElement('div');
  productsGrid.className = 'plp-products';
  const productsLoadMore = document.createElement('div');
  productsLoadMore.className = 'plp-load-more';
  // const loadMoreUrl = loadMoreLink || '#';
  // 新增：分页相关状态
  let currentPage = 1;
  const loadMoreStep = 9;
  let allGroupedData = []; // 存储所有聚合后的产品数据

  // 修改：Load More 点击逻辑
  productsLoadMore.addEventListener('click', () => {
    currentPage += 1;
    // eslint-disable-next-line no-use-before-define
    renderPagedItems();
    // 更新Load More显示状态
    // eslint-disable-next-line no-use-before-define
    updateLoadMoreVisibility();
  });

  const span = document.createElement('span');
  span.textContent = loadMoreTextContent || 'Load more';

  const productsNoResult = document.createElement('div');
  productsNoResult.className = 'plp-products-no-result';
  productsNoResult.innerHTML = noResultMessage || '<p>no result</p>';
  productsNoResult.style.display = 'none';

  productsLoadMore.append(span);
  productsBox.append(productsGrid);
  productsBox.append(productsLoadMore);
  productsBox.append(productsNoResult);

  if (isEditMode) {
    const topWrapper = document.createElement('div');

    const btnRow = document.createElement('div');
    const p = document.createElement('p');
    p.className = 'button-container';
    const a = document.createElement('a');
    a.className = 'button';
    a.title = graphqlUrl || '';
    a.href = graphqlUrl || '#';
    a.textContent = graphqlUrl || '';
    if (graphqlResource) {
      a.setAttribute('data-aue-resource', graphqlResource);
    }

    p.appendChild(a);
    btnRow.appendChild(p);
    topWrapper.appendChild(btnRow);

    const fieldsRow = document.createElement('div');
    const fieldsInner = document.createElement('div');
    const pf = document.createElement('p');
    pf.textContent = fields.join(',');
    fieldsInner.appendChild(pf);
    if (fieldsResource) fieldsInner.setAttribute('data-aue-resource', fieldsResource);
    fieldsRow.appendChild(fieldsInner);
    topWrapper.appendChild(fieldsRow);

    const loadMoreLinkRow = document.createElement('div');
    const loadMoreLinkInner = document.createElement('div');
    const loadMoreLinkP = document.createElement('p');
    const loadMoreLinkA = document.createElement('a');
    loadMoreLinkA.href = loadMoreLink || '#';
    loadMoreLinkA.title = loadMoreLink || '';
    loadMoreLinkA.textContent = loadMoreLink || '';
    loadMoreLinkA.className = 'button';
    loadMoreLinkP.appendChild(loadMoreLinkA);
    loadMoreLinkInner.appendChild(loadMoreLinkP);
    loadMoreLinkRow.appendChild(loadMoreLinkInner);
    topWrapper.appendChild(loadMoreLinkRow);

    block.replaceChildren(topWrapper, productsBox);
  } else {
    block.replaceChildren(productsBox);
  }

  if (!graphqlUrl) return;

  function extractImageFromShortDescription(item) {
    if (!item || !item.description_shortDescription || !item.description_shortDescription.html) {
      return null;
    }

    const { html } = item.description_shortDescription;
    // 从 <p> 标签中提取文本内容
    const match = html.match(/<p>([^<]+)<\/p>/);
    return match ? match[1].trim() : null;
  }

  function applyDefaultSort() {
    const selectedSortOption = document.querySelector('.plp-sort-option.selected');
    if (selectedSortOption) {
      const sortValue = selectedSortOption.dataset.value
          || selectedSortOption.getAttribute('data-value')
          || '';
      if (sortValue && sortValue.trim()) {
        if (window.applyPlpSort) {
          window.applyPlpSort(sortValue);
        } else {
          applyAggregatedSort('size', -1);
        }
      } else {
        applyAggregatedSort('size', -1);
      }
    } else {
      applyAggregatedSort('size', -1);
    }
  }

  function applyUrlFilters() {
    try {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);

      // 遍历所有URL参数
      urlParams.forEach((paramValue, paramName) => {
        if (paramValue) {
          // 直接使用参数名和值组合成筛选条件
          const targetValue = `${paramName}/${paramValue}`;
          const targetCheckbox = document.querySelector(`.plp-filter-item input[type="checkbox"][value$="${targetValue}"]`);

          if (targetCheckbox) {
            // 触发checkbox的点击事件
            targetCheckbox.click();

            // 展开对应的筛选组
            const filterGroup = targetCheckbox.closest('.plp-filter-group');
            if (filterGroup && filterGroup.classList.contains('hide')) {
              filterGroup.classList.remove('hide');
            }
          }
        }
      });
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('URL filter error:', e);
    }
  }

  // 新增：更新Load More按钮显示状态
  function updateLoadMoreVisibility() {
    const totalPages = Math.ceil(allGroupedData.length / loadMoreStep);
    if (currentPage >= totalPages) {
      productsLoadMore.style.display = 'none';
    } else {
      productsLoadMore.style.display = 'block';
    }
  }

  // 新增：渲染分页后的产品
  function renderPagedItems() {
    const start = (currentPage - 1) * loadMoreStep;
    const end = start + loadMoreStep;
    const pagedGroupedArray = allGroupedData.slice(start, end);

    // 处理所有产品数据的 productDetailPageLink
    pagedGroupedArray.forEach((group) => {
      const item = group.representative;
      if (item.productDetailPageLink && typeof item.productDetailPageLink === 'string') {
        const { hostname, pathname } = window.location;
        if (hostname.includes('hisense.com') && pathname.startsWith('/us')) {
          item.productDetailPageLink = item.productDetailPageLink.replace('/us/en', '/us');
        }
      }
    });

    // 渲染当前页的产品卡片（追加模式）
    pagedGroupedArray.forEach((group) => {
      const item = group.representative;
      const card = document.createElement('div');
      card.className = 'product-card';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'plp-product-card-title';
      let tagTitle = '';
      const badgeList = group.representative.badge || [];
      const targetStr = badgeList[0] || '';
      const lastSlashIndex = targetStr.lastIndexOf('/');
      tagTitle = lastSlashIndex > -1 ? targetStr.slice(lastSlashIndex + 1) : targetStr;
      titleDiv.innerHTML = `<div class="plp-product-card-tag">${tagTitle}</div>`;

      const imgDiv = document.createElement('div');
      imgDiv.className = 'plp-product-img';
      const imgPath = (() => {
        // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
        if (window.useShortDescriptionAsImage) {
          return extractImageFromShortDescription(item);
        }
        // 否则走默认逻辑
        if (!item || !item.mediaGallery_image) return null;
        const pKey = Object.keys(item.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
        return pKey ? item.mediaGallery_image[pKey] : null;
      })();
      if (imgPath) {
        const img = document.createElement('img');
        img.src = imgPath;
        imgDiv.appendChild(img);
      }

      const seriesDiv = document.createElement('div');
      seriesDiv.className = 'plp-product-series';
      if (fields.includes('series') && item.series) seriesDiv.textContent = item.series;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'plp-product-name';
      if (fields.includes('title')) {
        const metaTitle = (() => {
          if (!item) return null;
          const metaKey = Object.keys(item).find((k) => k.toLowerCase().includes('metadata'));
          const meta = metaKey ? item[metaKey] : null;
          if (meta && Array.isArray(meta.stringMetadata)) {
            const found = meta.stringMetadata.find((x) => x.name === 'title');
            return found ? found.value : null;
          }
          return null;
        })();
        const fullTitle = item.title || metaTitle || group.factoryModel || '';
        nameDiv.textContent = fullTitle;
        // 添加完整的title作为tooltip
        nameDiv.title = fullTitle;
      }

      const extraFields = document.createElement('div');
      extraFields.className = 'plp-product-extra';
      fields.forEach((f) => {
        if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
        const keyParts = f.includes('.') ? f.split('.') : f.split('_');
        const value = keyParts.reduce(
          (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
          item,
        );
        if (value !== null && value !== undefined) {
          const fld = document.createElement('div');
          const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
          fld.className = `plp-product-field ${safeClass}`;
          fld.textContent = value;
          extraFields.appendChild(fld);
        }
      });

      // sizes 区块（可点击，默认选中第一个尺寸，切换显示对应 variant）
      const sizesDiv = document.createElement('div');
      sizesDiv.className = 'plp-product-sizes';

      // 构建 size -> variant 的映射
      const sizeToVariant = new Map();
      group.variants.forEach((v) => {
        // eslint-disable-next-line no-use-before-define
        let s = extractSize(v);
        if (!s && v.sku) {
          const skuMatch = String(v.sku).match(/(\d{2,3})/);
          s = skuMatch ? skuMatch[1] : null;
        }
        if (!s) s = 'default';
        if (!sizeToVariant.has(s)) sizeToVariant.set(s, v);
      });

      const sizesArray = (Array.isArray(group.sizes) && group.sizes.length)
        ? group.sizes
        : Array.from(sizeToVariant.keys());
      // 如果用了默认排序，默认选中最大尺寸，其他排序选中第一个尺寸
      let [selectedSize] = sizesArray;
      let selectedVariant = selectedSize ? (sizeToVariant.get(selectedSize) || item) : item;

      // 用来更新卡片显示为指定变体
      const updateCardWithVariant = (variant) => {
        // image
        const variantImg = (() => {
          // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
          if (window.useShortDescriptionAsImage) {
            return extractImageFromShortDescription(variant);
          }
          // 否则走默认逻辑
          const imgPKey = variant && variant.mediaGallery_image && Object.keys(variant.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
          return imgPKey ? variant.mediaGallery_image[imgPKey] : null;
        })();

        const updateImg = imgDiv.querySelector('img');
        if (variantImg && updateImg) {
          updateImg.src = variantImg;
        } else if (updateImg) {
          updateImg.src = '';
        }
        // series
        if (fields.includes('series') && variant.series) seriesDiv.textContent = variant.series;
        // title/name
        const metaKey = variant && Object.keys(variant).find((k) => k.toLowerCase().includes('metadata'));
        let variantMetaTitle = null;
        if (metaKey) {
          const meta = variant[metaKey];
          if (meta && Array.isArray(meta.stringMetadata)) {
            const found = meta.stringMetadata.find((x) => x.name === 'title');
            variantMetaTitle = found ? found.value : null;
          }
        }
        if (fields.includes('title')) {
          nameDiv.textContent = variant.title || variantMetaTitle || group.factoryModel || '';
        }
        // extra fields
        extraFields.innerHTML = '';
        fields.forEach((f) => {
          if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
          const keyParts = f.includes('.') ? f.split('.') : f.split('_');
          const value = keyParts.reduce(
            (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
            variant,
          );
          if (value !== null && value !== undefined) {
            const fld = document.createElement('div');
            const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
            fld.className = `plp-product-field ${safeClass}`;
            fld.textContent = value;
            extraFields.appendChild(fld);
          }
        });
        // productDetailPageLink - 先检查当前产品尺寸是否有productDetailPageLink链接，如果没有，才使用共享链接
        const productDetailPageLink = variant.productDetailPageLink || group.sharedProductDetailPageLink || '#';
        if (productDetailPageLink && productDetailPageLink !== '#') {
          let link = card.querySelector && card.querySelector('.plp-product-btn');
          if (!link) {
            link = document.createElement('a');
            link.className = 'plp-product-btn';
            link.target = '_blank';
            card.append(link);
          }
          link.href = productDetailPageLink;
          link.textContent = 'Learn more';
        } else {
          const existingLink = card.querySelector && card.querySelector('.plp-product-btn');
          if (existingLink) existingLink.remove();
        }
      };

      // 创建尺寸节点并绑定事件
      sizesArray.forEach((s) => {
        const sp = document.createElement('span');
        sp.className = 'plp-product-size';
        sp.textContent = s;
        if (s === selectedSize) sp.classList.add('selected');
        sp.addEventListener('click', () => {
          if (selectedSize === s) return;
          // 更新选中样式
          const prev = sizesDiv.querySelector('.plp-product-size.selected');
          if (prev) prev.classList.remove('selected');
          sp.classList.add('selected');
          selectedSize = s;
          selectedVariant = sizeToVariant.get(s) || item;
          updateCardWithVariant(selectedVariant);
        });
        sizesDiv.appendChild(sp);
      });

      card.append(titleDiv, imgDiv, seriesDiv, nameDiv, sizesDiv, extraFields);
      productsGrid.append(card);

      updateCardWithVariant(selectedVariant);
    });

    // 更新结果计数，显示聚合后的产品卡数量
    try {
      const resultsEl = document.querySelector('.plp-results');
      if (resultsEl) {
        const visible = resultsEl.querySelector('.plp-results-count-visible');
        const hidden = resultsEl.querySelector('.plp-results-count');
        const count = allGroupedData.length;
        if (visible) {
          visible.textContent = String(count);
        }
        if (hidden) {
          hidden.textContent = String(count);
        }
        if (!visible && !hidden) {
          const currentText = resultsEl.textContent || '';
          const updatedText = currentText.replace(/\{[^}]*\}/, String(count));
          resultsEl.textContent = updatedText;
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }

    // 当结果为0时显示no result
    try {
      const noResultEl = document.querySelector('.plp-products-no-result');
      const cardWrapperEl = document.querySelector('.plp-product-card-wrapper');
      if (noResultEl) {
        if (allGroupedData.length === 0) {
          noResultEl.style.display = 'flex';
          productsGrid.style.display = 'none';
          cardWrapperEl.style.cssText = 'margin: auto !important;';
        } else {
          noResultEl.style.display = 'none';
          productsGrid.style.display = 'grid';
          cardWrapperEl.style.cssText = '';
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }
  }

  // 包含多个相同 factoryModel 的不同尺寸
  const extractSize = (item) => {
    if (!item) return null;
    if (item.size) return String(item.size).replace(/["\s]/g, '');
    if (item.sku) {
      const m = String(item.sku).match(/(\d{2,3})/);
      if (m) return m[1];
    }
    const metaTitle = (() => {
      if (!item) return null;
      const metaKey = Object.keys(item).find((k) => k.toLowerCase().includes('metadata'));
      const meta = metaKey ? item[metaKey] : null;
      if (meta && Array.isArray(meta.stringMetadata)) {
        const found = meta.stringMetadata.find((x) => x.name === 'title');
        return found ? found.value : null;
      }
      return null;
    })();
    const candidates = [metaTitle, item.title, item.subtitle].filter(Boolean);
    let foundSize = null;
    candidates.some((c) => {
      const mm = String(c).match(/(\d{2,3})/);
      if (mm) {
        const [, size] = mm;
        foundSize = size;
        return true;
      }
      return false;
    });
    if (foundSize) return foundSize;
    return null;
  };

  function renderItems(items) {
    // 重置分页状态
    currentPage = 1;
    productsGrid.innerHTML = ''; // 清空现有内容

    // 处理所有产品数据的 productDetailPageLink
    items.forEach((item) => {
      if (item.productDetailPageLink && typeof item.productDetailPageLink === 'string') {
        const { hostname, pathname } = window.location;
        if (hostname.includes('hisense.com') && pathname.startsWith('/us')) {
          item.productDetailPageLink = item.productDetailPageLink.replace('/us/en', '/us');
        }
      }
    });

    // 按 factoryModel 聚合
    const groups = {};
    items.forEach((it) => {
      const key = it.factoryModel || it.spu || it.overseasModel;
      if (!groups[key]) {
        groups[key] = {
          factoryModel: it.factoryModel || null,
          representative: it,
          variants: [],
          sizes: new Set(),
        };
      }
      groups[key].variants.push(it);
      // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
      if (window.useShortDescriptionAsImage) {
        if (!groups[key].representative.description_shortDescription
            && it.description_shortDescription) {
          groups[key].representative = it;
        }
      } else if (!groups[key].representative.mediaGallery_image && it.mediaGallery_image) {
        // 否则走默认逻辑
        groups[key].representative = it;
      }
      const sz = extractSize(it);
      if (sz) groups[key].sizes.add(sz);
    });

    allGroupedData = Object.keys(groups).map((k) => {
      const g = groups[k];
      const sizes = Array.from(g.sizes).filter(Boolean).sort((a, b) => Number(b) - Number(a));

      // 检查聚合产品是否有任意size有productDetailPageLink，有就共享这个链接
      let sharedProductDetailPageLink = g.variants.find((variant) => variant && variant.productDetailPageLink)?.productDetailPageLink;

      if (sharedProductDetailPageLink && sharedProductDetailPageLink.startsWith('/')) {
        const currentUri = window.location.href;
        const hasContentHisense = currentUri.includes('/content/hisense');
        const wtbHasContentHisense = sharedProductDetailPageLink.includes('/content/hisense');

        if (hasContentHisense && !wtbHasContentHisense) {
          sharedProductDetailPageLink = `/content/hisense${sharedProductDetailPageLink}`;
        } else if (!hasContentHisense && wtbHasContentHisense) {
          sharedProductDetailPageLink = sharedProductDetailPageLink.replace('/content/hisense', '');
        }
        sharedProductDetailPageLink = sharedProductDetailPageLink.replace('.html', '');
      }

      return {
        key: k,
        factoryModel: g.factoryModel,
        representative: g.representative,
        variants: g.variants,
        sizes,
        sharedProductDetailPageLink,
      };
    });

    productsGrid.setAttribute('data-group-length', allGroupedData.length);

    // 渲染第一页
    renderPagedItems();
    // 更新Load More显示状态
    updateLoadMoreVisibility();
  }

  const mockData = {};

  fetch(graphqlUrl)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      const items = (data && data.data) || [];
      // 缓存到全局，供过滤器使用
      window.productData = items;
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
      // 页面初始化查询用默认排序
      applyDefaultSort();
      // 检查URL参数并应用筛选
      applyUrlFilters();
    })
    .catch(() => {
      const items = (mockData && mockData.data) || [];
      window.productData = items;
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
      // 页面初始化查询用默认排序
      applyDefaultSort();
      // 检查URL参数并应用筛选
      applyUrlFilters();
    });
  /* eslint-disable-next-line no-underscore-dangle */
  window.renderItems = renderItems;
}

// 是否使用 description_shortDescription 作为图片链接，默认使用
window.useShortDescriptionAsImage = false;

// 暴露渲染和筛选接口到window全局，供 filter 和 tags 使用（在 renderItems 定义后）
window.renderProductsInternal = function renderProductsInternalProxy(items) {
  if (typeof window.renderItems === 'function') {
    window.renderItems(items);
  }
};
window.lastRenderedProducts = null;
// 当前排序状态，用于筛选时判断是否需要默认选中最大尺寸
window.currentSortKey = '';

window.renderPlpProducts = function renderPlpProductsWrapper(items) {
  window.lastRenderedProducts = Array.isArray(items) ? items.slice() : [];
  window.renderProductsInternal(items);
};

// 排序
// eslint-disable-next-line consistent-return
window.applyPlpSort = function applyPlpSort(sortKey) {
  try {
    const sortProperty = String(sortKey || '').trim();

    // 保存当前排序状态
    window.currentSortKey = sortProperty;

    let direction = -1; // 默认降序
    let effectiveSortProperty = sortProperty;
    if (effectiveSortProperty.startsWith('-')) {
      direction = 1; // 升序
      effectiveSortProperty = effectiveSortProperty.slice(1);
    }

    // 如果没有指定排序属性或者指size
    if (!effectiveSortProperty || effectiveSortProperty === 'size') {
      return applyAggregatedSort('size', direction);
    }

    // 其他属性也使用聚合后排序逻辑
    applyAggregatedSort(effectiveSortProperty, direction);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn(e);
  }
};

// filters：获取选中的 data-option-value checkbox，并对 window.productData 进行过滤
window.applyPlpFilters = function applyPlpFilters() {
  try {
    // 检查当前排序状态，如果是默认排序和size，需要筛选后后默认选中最大尺寸
    const currentSort = String(window.currentSortKey || '').trim();
    const effectiveSort = currentSort.startsWith('-') ? currentSort.slice(1) : currentSort;
    window.isDefaultSortApplied = (!effectiveSort || effectiveSort === 'size');

    const allProducts = window.productData || [];

    // 收集所有被选中的 filter group,同组内为 OR，不同组为 AND
    const filterGroups = [...document.querySelectorAll('.plp-filter-group')];
    const selectedByGroup = filterGroups.map((group) => [...group.querySelectorAll('input[type="checkbox"][data-option-value]:checked')]
      .map((checkbox) => checkbox.getAttribute('data-option-value'))
      .filter(Boolean)).filter((arr) => arr && arr.length);

    if (!selectedByGroup.length) {
      // 无过滤时恢复全部，清空筛选结果
      window.filteredProducts = null;
      window.renderPlpProducts(allProducts);
      return;
    }

    // 执行过滤，要求产品必须要有tags属性
    const filtered = allProducts.filter((item) => {
      const tagsRaw = Array.isArray(item.tags) ? item.tags : [];
      const itemTags = tagsRaw.map((t) => String(t).toLowerCase());
      if (!itemTags.length) return false;

      return selectedByGroup.every((groupSelected) => groupSelected.some((selectedTag) => {
        const selectedLower = String(selectedTag).toLowerCase();
        // 完全匹配标签路径
        return itemTags.includes(selectedLower);
      }));
    });

    // 保存筛选结果，用于后续排序
    window.filteredProducts = filtered;
    window.renderPlpProducts(filtered);
  } catch (err) {
    /* eslint-disable-next-line no-console */
    if (window.renderPlpProducts) window.renderPlpProducts(window.productData || []);
  }
};
