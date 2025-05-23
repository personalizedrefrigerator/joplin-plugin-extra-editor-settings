import { EditorView, WidgetType } from '@codemirror/view';
import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';
import * as DOMPurify from 'dompurify';
import { PostMessageHandler } from '../../../api/types';
import makeBlockReplaceExtension from './utils/makeBlockReplaceExtension';

interface CancelEvent {
	cancelled: boolean;
}

interface RenderingContext {
	renderMarkup(markup: string, event: CancelEvent): Promise<string|null>;
}

interface MarkupWidgetOptions {
	extractMath?: boolean;
	block?: boolean;
}

const sanitize = (html: string) => {
	return DOMPurify.sanitize(html, {
		// Required to load joplin-content:// images.
		ALLOW_UNKNOWN_PROTOCOLS: true,
		// Links are handled elsewhere and should not be clickable.
		FORBID_TAGS: ['a'],
		// Extra prevention against DOM clobbering
		SANITIZE_NAMED_PROPS: true,
	});
};

const extractRenderedContent = (html: string, isMath: boolean) => {
	const dom = new DOMParser().parseFromString(html, 'text/html');

	// Math: Extract MathML
	if (isMath) {
		const math = dom.querySelector('math');

		// Remove all <annotation>s -- KaTeX can store the original TeX as an <annotation>, which
		// is made visible by DOMPurify.
		let annotation;
		while (annotation = math?.querySelector('annotation')) {
			annotation.remove();
		}

		return dom.querySelector('math')?.outerHTML ?? html;
	} else {
		const allParagraphs = dom.querySelectorAll('p');
		if (allParagraphs.length === 1) {
			return allParagraphs[0].innerHTML;
		}

		return dom.querySelector('#rendered-md')?.innerHTML ?? html;
	}
};

const renderedMdClassName = 'cm-md-rendered-markdown';

class RenderedMarkupWidget extends WidgetType {
	private cancelEvent = { cancelled: false };
	private sanitizedHtml: string;
	private markupPromise: Promise<void>|null = null;

	public constructor(
		private markup: string,
		private context: RenderingContext,
		private options?: MarkupWidgetOptions,
	) {
		super();
	}

	public eq(other: RenderedMarkupWidget) {
		return other.markup === this.markup && this.options?.block === other.options?.block;
	}

	private render() {
		// Already rendering?
		if (this.markupPromise) {
			return this.markupPromise;
		}

		this.markupPromise = (async () => {
			let html = await this.context.renderMarkup(this.markup, this.cancelEvent);
			if (html) {
				html = extractRenderedContent(html, this.options?.extractMath ?? false);
				this.sanitizedHtml = sanitize(html);
			} else { // cancelled
				this.sanitizedHtml = '';
				this.markupPromise = null;
			}
		})();

		return this.markupPromise;
	}

	public toDOM(view: EditorView) {
		const container = document.createElement(this.options?.block ? 'div' : 'span');
		container.classList.add(renderedMdClassName);

		let content = container;
		if (this.options?.block) {
			container.classList.add('cm-line');

			content = document.createElement('div');
			content.classList.add('content');
			container.appendChild(content);

			// Move the cursor to the line when the container is clicked
			container.onclick = () => {
				const pos = view.posAtDOM(container);
				view.dispatch({
					selection: { anchor: Math.min(view.state.doc.length, pos + this.markup.length) },
				});
			};
		}

		if (this.sanitizedHtml) {
			content.innerHTML = this.sanitizedHtml;
		} else {
			void this.render().then(() => {
				content.innerHTML = this.sanitizedHtml;
				view.requestMeasure();
			});
		}

		return container;
	}

	public destroy(_dom: HTMLElement): void {
		this.cancelEvent.cancelled = true;
	}

	public ignoreEvent() {
		return true;
	}
}


export const renderedMarkupReplacement = (postMessage: PostMessageHandler) => {
	type CacheEntry = { value: string, expiresAt: number };
	const renderingCache = new Map<string, CacheEntry>();
	const removeOldCacheItems = () => {
		const keyIterator = renderingCache.keys();
		while (renderingCache.size > 500) {
			renderingCache.delete(keyIterator.next().value);
		}
	};

	const renderingContext: RenderingContext = {
		renderMarkup: async (markup: string) => {
			const cacheEntry = renderingCache.get(markup);
			if (cacheEntry) {
				const isOld = cacheEntry.expiresAt < performance.now();
				if (isOld) {
					renderingCache.delete(markup);
				} else {
					return cacheEntry.value;
				}
			}

			const renderResult = (await postMessage({
				type: 'renderMarkup',
				markup,
			}));
			if (renderResult === null) {
				return null;
			} else {
				const html: string = renderResult.html;
				removeOldCacheItems();

				const isImage = html.toLowerCase().includes('<img');
				renderingCache.set(markup, {
					value: html,
					// Reload cached images more frequently than other content -- images can be changed
					// externally (and render differently after this happens).
					expiresAt: performance.now() + (isImage ? 1000 : 1000 * 60),
				});

				return html;
			}
		},
	};

	return [
		EditorView.theme({
			// Inline rendered markup
			[`& .${renderedMdClassName}:not(.cm-line)`]: {
				// Makes clicking on the rendered item focus its containing line
				'pointer-events': 'none',
			},
			// Block rendered markup
			[`& .cm-line.${renderedMdClassName}`]: {
				position: 'relative',
				overflow: 'hidden',
			},
			[`& .cm-line.${renderedMdClassName} table`]: {
				'& td': {
					border: '1px solid var(--joplin-color)',
					margin: 0,
				}
			},
			[`& .${renderedMdClassName} img`]: {
				// Too-large images can cause scrolling issues
				'max-width': '100%',
				'max-height': '50vh',
			},
			'& math': {
				// For now, rather than attempting to load the KaTeX math fonts (or bundle
				// custom fonts), try to use math fonts that are probably pre-installed:
				'font-family': '"Noto Sans Math", "Cambria Math", "STIX Two Math", "STIX Math"',
			},
			'& .joplin-table-wrapper': {
				display: 'flex',
				overflow: 'auto',
			},
			[`& .${renderedMdClassName} .not-loaded-resource img`]: {
				width: '26px',
				height: '26px',
			},
		}),
		makeInlineReplaceExtension({
			createDecoration: (node, state) => {
				if (node.name === 'InlineMath' || node.name === 'Image') {
					const nodeText = state.sliceDoc(node.from, node.to);
					return new RenderedMarkupWidget(nodeText, renderingContext, {
						extractMath: node.name === 'InlineMath',
					});
				}
				return null;
			},
		}),
		makeBlockReplaceExtension({
			createDecoration: (node, state) => {
				if (node.name === 'BlockMath') {
					const nodeText = state.sliceDoc(node.from, node.to);
					return new RenderedMarkupWidget(nodeText, renderingContext, {
						extractMath: node.name === 'BlockMath',
						block: true,
					});
				}
				return null;
			},
		}),
	];
};

export default renderedMarkupReplacement;
