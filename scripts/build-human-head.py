"""Bake head/neck only from the explicitly CC0 MPFB base OBJ.

Usage: python3 scripts/build-human-head.py /path/to/base.obj UPSTREAM_REVISION
No Blender, paid service, or source portrait projection is used.
"""
import hashlib
import json
import math
import re
import sys
from pathlib import Path


def average(points):
    return [sum(p[j] for p in points) / len(points) for j in range(3)]


def subdivide(vertices, faces):
    centers = [average([vertices[i] for i in f]) for f in faces]
    edges, adjacent = {}, [[] for _ in vertices]
    for fi, face in enumerate(faces):
        for k, i in enumerate(face):
            adjacent[i].append(fi)
            edge = tuple(sorted((i, face[(k + 1) % len(face)])))
            edges.setdefault(edge, []).append(fi)
    neighbours = [[] for _ in vertices]
    boundary = [[] for _ in vertices]
    for (a, b), fs in edges.items():
        neighbours[a].append(b)
        neighbours[b].append(a)
        if len(fs) == 1:
            boundary[a].append(b)
            boundary[b].append(a)
    result = []
    for i, p in enumerate(vertices):
        if len(boundary[i]) == 2:
            result.append([(6 * p[j] + sum(vertices[k][j] for k in boundary[i])) / 8 for j in range(3)])
        else:
            n = len(adjacent[i])
            f = average([centers[k] for k in adjacent[i]])
            r = average([average([p, vertices[k]]) for k in neighbours[i]])
            result.append([(f[j] + 2 * r[j] + (n - 3) * p[j]) / n for j in range(3)])
    edge_ids = {}
    for edge, fs in edges.items():
        edge_ids[edge] = len(result)
        result.append(average([vertices[i] for i in edge] + ([centers[i] for i in fs] if len(fs) == 2 else [])))
    face_start = len(result)
    result.extend(centers)
    quads = []
    for fi, face in enumerate(faces):
        for k, i in enumerate(face):
            following, previous = face[(k + 1) % len(face)], face[k - 1]
            quads.append([i, edge_ids[tuple(sorted((i, following)))], face_start + fi, edge_ids[tuple(sorted((previous, i)))]])
    return result, quads


def convert(path, revision):
    raw = path.read_bytes()
    if b'explicitly released as CC0' not in raw[:1000]:
        raise ValueError('Expected the explicitly CC0 MPFB base mesh')
    if not re.fullmatch('[a-f0-9]{40}', revision):
        raise ValueError('A full upstream Git revision is required')
    vertices, faces, group = [], [], ''
    for line in raw.decode().splitlines():
        words = line.split()
        if not words:
            continue
        if words[0] == 'v':
            vertices.append(list(map(float, words[1:4])))
        elif words[0] == 'g':
            group = words[1]
        elif words[0] == 'f' and group == 'body':
            indices = [int(w.split('/')[0]) - 1 for w in words[1:]]
            if all(vertices[i][1] > 5.7 for i in indices):
                faces.append(indices)
    used = sorted(set(i for f in faces for i in f))
    remap = {i: k for k, i in enumerate(used)}
    points = [vertices[i] for i in used]
    points, faces = subdivide(points, [[remap[i] for i in f] for f in faces])
    # Source OBJ is in decimetre-scale model coordinates. Fit the existing study.
    points = [[x * .112, (y - 7.063) * .12, (z - .55) * .12] for x, y, z in points]
    for p in points:
        blend = max(0., min(1., (-p[1] - .110) / .052))
        p[0] = p[0] * (1 - blend) + (.061 * math.tanh(p[0] / .061)) * blend
        p[2] = p[2] * (1 - blend) + (.055 * math.tanh(p[2] / .055)) * blend
    triangles = []
    for f in faces:
        for k in range(1, len(f) - 1):
            triangles.extend([f[0], f[k], f[k + 1]])
    normals = [[0., 0., 0.] for _ in points]
    for k in range(0, len(triangles), 3):
        ids = triangles[k:k + 3]
        a, b, c = [points[i] for i in ids]
        u, v = [[p[j] - a[j] for j in range(3)] for p in (b, c)]
        n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
        for i in ids:
            for j in range(3):
                normals[i][j] += n[j]
    normals = [[x / math.hypot(*n) for x in n] for n in normals]
    data = {'p': [round(x, 7) for p in points for x in p], 'n': [round(x, 7) for p in normals for x in p], 'i': triangles,
            'provenance': {'license': 'CC0-1.0', 'originalToSH': False, 'region': 'head-neck', 'sourceRevision': revision,
                           'sourceSha256': hashlib.sha256(raw).hexdigest(), 'source': f'https://github.com/makehumancommunity/mpfb2/blob/{revision}/src/mpfb/data/3dobjs/base.obj',
                           'adaptation': 'Head/neck extraction, Catmull-Clark subdivision, metric fit and recalculated normals by SH'}}
    destination = Path(__file__).parent / 'original-cricket/anatomical-head.mjs'
    destination.write_text('// Derived from the CC0 MakeHuman/MPFB base mesh; see provenance.\nexport function anatomicalHeadData(){return ' + json.dumps(data, separators=(',', ':')) + ';}\n')
    print(json.dumps({'vertices': len(points), 'triangles': len(triangles)//3, 'output': str(destination)}))


if __name__ == '__main__':
    convert(Path(sys.argv[1]), sys.argv[2])
