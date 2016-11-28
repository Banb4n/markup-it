const { List } = require('immutable');
const { Serializer, Deserializer, Inline, INLINES } = require('../../');
const reInline = require('../re/inline');

// List of valid html blocks names, accorting to commonmark spec
// http://jgm.github.io/CommonMark/spec.html#html-blocks
// Treat these blocks as RAW HTML
const htmlBlocks = [
    'address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption', 'center', 'col', 'colgroup',
    'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hr',
    'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem', 'meta', 'nav',
    'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'pre', 'script', 'section',
    'source', 'title', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title',
    'tr', 'track', 'ul'
];

/**
 * Test if a tag name is a valid HTML block
 * @param {String} tag
 * @return {Boolean}
 */
function isHTMLBlock(tag) {
    tag = tag.toLowerCase();
    return htmlBlocks.indexOf(tag) >= 0;
}

/**
 * Create an HTML node
 * @param {String} raq
 * @return {Inline}
 */
function createHTML(html) {
    return Inline.create({
        type: INLINES.HTML,
        isVoid: true,
        data: { html }
    });
}

/**
 * Serialize an HTML node to markdown
 * @type {Serializer}
 */
const serialize = Serializer()
    .matchType(INLINES.HTML)
    .then(state => {
        const node = state.peek();
        return node.shift().write(node.text);
    });

/**
 * Deserialize HTML from markdown
 * @type {Deserializer}
 */
const deserialize = Deserializer()
    .matchRegExp(reInline.html, (state, match) => {
        const [ tag, tagName, innerText ] = match;
        let startTag, endTag, innerNodes = [];

        if (innerText) {
            startTag = tag.substring(0, tag.indexOf(innerText));
            endTag   = tag.substring(tag.indexOf(innerText) + innerText.length);
        } else {
            startTag = tag;
            endTag   = '';
        }

        if (tagName && !isHTMLBlock(tagName) && innerText) {
            const isLink = (tagName.toLowerCase() === 'a');

            innerNodes = state
                .setProp(isLink ? 'link' : 'html', state.depth)
                .deserialize(innerText);
        } else if (innerText) {
            innerNodes = [
                createHTML(innerText)
            ];
        }

        let nodes = List([ createHTML(startTag) ])
            .concat(innerNodes);

        if (endTag) {
            nodes = nodes.push(createHTML(endTag));
        }

        return state.push(nodes);
    });

module.exports = { serialize, deserialize };
