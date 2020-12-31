import Debug from "debug";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom";
import { ShopifyNestContentComponent } from "../content/content.component";
import { ShopifyApiArticleService } from "../../services/shopify-api-article.service";
import { Article } from "@ribajs/shopify-tda";
import pugTemplate from "./content-article.component.pug";

export interface Scope {
  save: ShopifyNestContentBlogArticleComponent["save"];
  article?: Article;
  blogId?: number;
  articleId?: number;
  new_body_html: string;
}

export interface IContentArticle extends Article {
  href?: string;
}

export class ShopifyNestContentBlogArticleComponent extends ShopifyNestContentComponent {
  public static tagName = "shopify-nest-content-article";

  protected autobind = true;

  static get observedAttributes() {
    return ["blog-id", "article-id"];
  }

  protected editor: Element | null = null;
  protected debug = Debug(
    "component:" + ShopifyNestContentBlogArticleComponent.tagName
  );

  protected scope: Scope = {
    save: this.save,
    new_body_html: "",
  };

  constructor(
    element?: HTMLElement,
    readonly shopifyApiArticleService = ShopifyApiArticleService.getSingleton()
  ) {
    super(element);
    this.shopifyApiArticleService = shopifyApiArticleService;
    this.debug("constructor", this);
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(ShopifyNestContentBlogArticleComponent.observedAttributes);
  }

  public save() {
    if (!this.scope.blogId || !this.scope.articleId || !this.scope.article) {
      throw new Error(
        "Blog id and article id are required to update an article!"
      );
    }

    this.scope.article.body_html = this.scope.new_body_html;

    this.debug("save", this.scope.article);
    this.shopifyApiArticleService
      .update(this.scope.blogId, this.scope.articleId, this.scope.article)
      .then((result) => {
        this.debug("update article", result);
        return result;
      })
      .catch((error: Error) => {
        console.error(error);
      });
  }

  protected async init(observedAttributes: string[]) {
    return super.init(observedAttributes).then((view) => {
      return view;
    });
  }

  protected async beforeBind() {
    this.debug("beforeBind");
    if (!this.scope.blogId || !this.scope.articleId) {
      throw new Error("blog id and article id are required!");
    }
    return this.shopifyApiArticleService
      .get(this.scope.blogId, this.scope.articleId)
      .then((article) => {
        this.scope.article = article;
      })
      .catch((error: Error) => {
        console.error(error);
      });
  }

  protected async afterBind() {
    this.debug("afterBind", this.editor);
    this.editor = document.getElementById("content-editor");

    if (this.editor) {
      this.editor.addEventListener("change", (event) => {
        if (this.scope.article) {
          const detail = (event as CustomEvent<string>).detail;
          if (detail && this.scope.new_body_html !== detail) {
            this.scope.new_body_html = detail;
          }
          this.debug("Editor value changed", this.scope.article.body_html);
        }
      });
    }
  }

  protected requiredAttributes() {
    return [];
  }

  protected attributeChangedCallback(
    attributeName: string,
    oldValue: any,
    newValue: any,
    namespace: string | null
  ) {
    super.attributeChangedCallback(
      attributeName,
      oldValue,
      newValue,
      namespace
    );
  }

  // deconstructor
  protected disconnectedCallback() {
    super.disconnectedCallback();
  }

  protected template() {
    let template: string | null = null;
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this.el)) {
      this.debug("Do not template, because element has child nodes");
      return template;
    } else {
      template = pugTemplate(this.scope);
      this.debug("Use template", template);
      return template;
    }
  }
}