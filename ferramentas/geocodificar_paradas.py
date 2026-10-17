"""Geocodifica as paradas de Alegrete no Nominatim (OpenStreetMap).
Uso: python -I geocode.py paradas.txt saida.json
"""
import json, sys, time, urllib.parse, urllib.request

UA = 'ExpressoGaucho-prototipo/1.0 (projeto academico Unipampa)'
VIEWBOX = '-55.90,-29.68,-55.68,-29.86'   # área urbana de Alegrete/RS

ALIAS = {
    '12 BE Comb': ['12º Batalhão de Engenharia de Combate', 'Batalhão de Engenharia'],
    '12 BEComb': ['12º Batalhão de Engenharia de Combate', 'Batalhão de Engenharia'],
    'Daer': ['DAER', 'Departamento Autônomo de Estradas de Rodagem'],
    'Unipampa': ['Universidade Federal do Pampa', 'Unipampa'],
    'Rótula da Unipampa': ['Universidade Federal do Pampa'],
    'Santa Casa': ['Santa Casa de Caridade', 'Santa Casa'],
    'Santa Casa / UPA': ['Santa Casa de Caridade', 'UPA'],
    'Praça G. Vargas': ['Praça Getúlio Vargas'],
    'Praça Getúlio Vargas': ['Praça Getúlio Vargas'],
    'Praça Gen. Osório': ['Praça General Osório'],
    'Praça dos Patinhos': ['Praça dos Patinhos'],
    'Av. Rondon': ['Avenida Marechal Rondon', 'Rondon'],
    'Rondon': ['Avenida Marechal Rondon', 'Rondon'],
    'Av. Rondon (Loja Schein)': ['Avenida Marechal Rondon', 'Rondon'],
    'Barão do Cerro Largo': ['Rua Barão do Cerro Largo'],
    'Barão do Cerro Largo (M. Real)': ['Rua Barão do Cerro Largo'],
    'Barão do Cerro Largo/Mundo Real': ['Rua Barão do Cerro Largo'],
    'R. Barão do Cerro Largo (M.Real)': ['Rua Barão do Cerro Largo'],
    'R. Barão do Cerro Largo (Ícaro)': ['Rua Barão do Cerro Largo'],
    'Rua Barão do Cerro Largo': ['Rua Barão do Cerro Largo'],
    'Rua N. Sra. do Carmo': ['Rua Nossa Senhora do Carmo'],
    'Rua Castelo Branco / Piola': ['Rua Castelo Branco', 'Piola'],
    'Bairro N. Sra. Conceição': ['Nossa Senhora da Conceição', 'Conceição'],
    'Bairro Dr. Romário': ['Doutor Romário', 'Romário'],
    'CIEP - Cohab Restinga': ['Cohab', 'Restinga'],
    'Escola Farroupilha-Vera Cruz': ['Escola Farroupilha', 'Vera Cruz'],
    'IRMA (Vila Nova)': ['Vila Nova'],
    'Ibirapuitã (Parque de Máq.)': ['Ibirapuitã'],
    'Sant Pastur': ['Saint Pastous', 'Saint Pastour'],
    'Saint Pastour': ['Saint Pastous', 'Saint Pastour'],
    'Mercado União II': ['Mercado União'],
    'Escola Emilio Zuñeda': ['Escola Emílio Zuñeda', 'Zuñeda'],
    'Club Sub Tenentes': ['Clube dos Subtenentes', 'Subtenentes'],
    'General Alimentos': ['General Alimentos'],
    'Bairro Capão do Angico': ['Capão do Angico'],
    'Bairro Ibirapuitã': ['Ibirapuitã'],
    'Bairro Macedo': ['Macedo'],
    'Balneário Caverá': ['Balneário Caverá', 'Caverá'],
}


def busca(q):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
        'q': q + ', Alegrete, RS, Brasil', 'format': 'jsonv2', 'limit': 1,
        'viewbox': VIEWBOX, 'bounded': 1, 'countrycodes': 'br'})
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'pt-BR'})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)
    time.sleep(1.1)  # política de uso do Nominatim: no máximo 1 consulta/s
    return data[0] if data else None


def main():
    paradas = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
    out = {}
    for p in paradas:
        res = None
        for q in ALIAS.get(p, [p]):
            try:
                res = busca(q)
            except Exception as e:  # noqa: BLE001
                print('erro', p, e, file=sys.stderr)
            if res:
                out[p] = {'lat': float(res['lat']), 'lng': float(res['lon']), 'q': q,
                          'tipo': res.get('type'), 'nome': res.get('display_name', '')[:90]}
                break
        print(('OK  ' if res else '--  ') + p + ('  ->  ' + out[p]['nome'] if res else ''), flush=True)
    json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


main()
