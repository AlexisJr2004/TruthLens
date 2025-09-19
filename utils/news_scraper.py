"""
Script para extraer contenido de páginas de noticias
Extrae título, contenido, fecha, autor y otros metadatos de artículos de noticias
"""

import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
from datetime import datetime
import argparse

class NewsExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def extract_content(self, url):
        """
        Extrae el contenido principal de una página de noticias
        """
        try:
            # Obtener la página
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Parsear el HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extraer información
            article_data = {
                'url': url,
                'title': self._extract_title(soup),
                'content': self._extract_content(soup),
                'author': self._extract_author(soup),
                'publish_date': self._extract_date(soup),
                'description': self._extract_description(soup),
                'keywords': self._extract_keywords(soup),
                'images': self._extract_images(soup, url),
                'extracted_at': datetime.now().isoformat()
            }
            
            return article_data
            
        except requests.RequestException as e:
            print(f"Error al acceder a la URL: {e}")
            return None
        except Exception as e:
            print(f"Error al procesar la página: {e}")
            return None
    
    def _extract_title(self, soup):
        """Extrae el título del artículo"""
        # Buscar en meta tags primero
        title_meta = soup.find('meta', property='og:title')
        if title_meta and title_meta.get('content'):
            return title_meta['content'].strip()
        
        # Buscar en el tag title
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()
        
        # Buscar en headers h1
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text().strip()
        
        return "Título no encontrado"
    
    def _extract_content(self, soup):
        """Extrae el contenido principal del artículo"""
        content_selectors = [
            'article',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content',
            '.story-body',
            '.article-body',
            'main'
        ]
        
        content = ""
        
        # Intentar con selectores comunes
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                for element in elements:
                    # Remover elementos no deseados
                    for unwanted in element.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                        unwanted.decompose()
                    
                    text = element.get_text(separator=' ', strip=True)
                    if len(text) > len(content):
                        content = text
        
        # Si no encuentra contenido con selectores, usar párrafos
        if not content or len(content) < 100:
            paragraphs = soup.find_all('p')
            content = ' '.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20])
        
        return content.strip() if content else "Contenido no encontrado"
    
    def _extract_author(self, soup):
        """Extrae el autor del artículo"""
        # Buscar en meta tags
        author_meta = soup.find('meta', attrs={'name': 'author'})
        if author_meta and author_meta.get('content'):
            return author_meta['content'].strip()
        
        # Buscar en JSON-LD
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                data = json.loads(json_ld.string)
                if isinstance(data, list):
                    data = data[0]
                author = data.get('author')
                if author:
                    if isinstance(author, dict):
                        return author.get('name', '')
                    elif isinstance(author, str):
                        return author
            except:
                pass
        
        # Buscar en clases comunes
        author_selectors = [
            '.author',
            '.byline',
            '.by-author',
            '[rel="author"]',
            '.article-author'
        ]
        
        for selector in author_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        return "Autor no encontrado"
    
    def _extract_date(self, soup):
        """Extrae la fecha de publicación"""
        # Buscar en meta tags
        date_selectors = [
            ('meta', {'property': 'article:published_time'}),
            ('meta', {'name': 'publish-date'}),
            ('meta', {'name': 'date'}),
            ('meta', {'property': 'og:updated_time'}),
            ('time', {'datetime': True})
        ]
        
        for tag, attrs in date_selectors:
            element = soup.find(tag, attrs)
            if element:
                date_str = element.get('content') or element.get('datetime')
                if date_str:
                    return date_str.strip()
        
        # Buscar en JSON-LD
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                data = json.loads(json_ld.string)
                if isinstance(data, list):
                    data = data[0]
                date_published = data.get('datePublished') or data.get('dateCreated')
                if date_published:
                    return date_published
            except:
                pass
        
        return "Fecha no encontrada"
    
    def _extract_description(self, soup):
        """Extrae la descripción del artículo"""
        desc_meta = soup.find('meta', attrs={'name': 'description'})
        if desc_meta and desc_meta.get('content'):
            return desc_meta['content'].strip()
        
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()
        
        return "Descripción no encontrada"
    
    def _extract_keywords(self, soup):
        """Extrae las palabras clave del artículo"""
        keywords_meta = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_meta and keywords_meta.get('content'):
            return [k.strip() for k in keywords_meta['content'].split(',')]
        
        return []
    
    def _extract_images(self, soup, base_url):
        """Extrae las imágenes del artículo"""
        images = []
        
        # Imagen principal de OpenGraph
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            images.append(urljoin(base_url, og_image['content']))
        
        # Buscar imágenes en el contenido
        img_tags = soup.find_all('img', src=True)
        for img in img_tags[:5]:  # Limitar a 5 imágenes
            src = img.get('src')
            if src:
                full_url = urljoin(base_url, src)
                if full_url not in images:
                    images.append(full_url)
        
        return images
    
    def save_to_file(self, data, filename=None):
        """Guarda los datos extraídos en un archivo JSON"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            os.makedirs('temp', exist_ok=True)
            filename = f"temp/news_content_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Datos guardados en: {filename}")

def main():
    parser = argparse.ArgumentParser(description='Extractor de contenido de noticias')
    parser.add_argument('url', nargs='?', help='URL del artículo de noticias')
    parser.add_argument('--output', '-o', help='Archivo de salida (JSON)')
    parser.add_argument('--print', '-p', action='store_true', help='Imprimir resultado en consola')
    
    args = parser.parse_args()
    
    # Si no se proporciona URL como argumento, preguntarla
    if not args.url:
        args.url = input("Ingresa la URL del artículo de noticias: ").strip()
        if not args.url:
            print("❌ Error: Debes proporcionar una URL válida")
            return
    
    # Crear extractor
    extractor = NewsExtractor()
    
    print(f"Extrayendo contenido de: {args.url}")
    print("-" * 50)
    
    # Extraer contenido
    article_data = extractor.extract_content(args.url)
    
    if article_data:
        if args.print:
            print(f"Título: {article_data['title']}")
            print(f"Autor: {article_data['author']}")
            print(f"Fecha: {article_data['publish_date']}")
            print(f"Descripción: {article_data['description']}")
            print(f"Palabras clave: {', '.join(article_data['keywords'])}")
            print(f"Número de imágenes: {len(article_data['images'])}")
            print(f"\nContenido ({len(article_data['content'])} caracteres):")
            print("-" * 30)
            print(article_data['content'][:500] + "..." if len(article_data['content']) > 500 else article_data['content'])
        
        # Guardar en archivo
        extractor.save_to_file(article_data, args.output)
        
        print(f"\n✅ Extracción completada exitosamente")
    else:
        print("❌ Error: No se pudo extraer el contenido")

if __name__ == "__main__":
    main()
