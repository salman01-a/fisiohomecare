# Step 1: Gunakan image resmi Node.js 20 (LTS) berbasis Alpine Linux yang ringan
FROM node:20-alpine

# Step 2: Tentukan working directory di dalam container
WORKDIR /usr/src/app

# Step 3: Salin package.json dan package-lock.json untuk instalasi dependensi
# Ini diletakkan sebelum menyalin kode untuk memanfaatkan cache Docker
COPY package*.json ./

# Step 4: Install hanya dependensi production untuk menjaga ukuran image tetap kecil
# Dan bersihkan cache npm untuk mengurangi ukuran image lebih lanjut
RUN npm ci --only=production && npm cache clean --force

# Step 5: Salin folder source code ke dalam container
COPY src ./src

# Step 6: Salin file konfigurasi tambahan jika diperlukan (seperti .sequelizerc)
COPY .sequelizerc ./

# Step 7: Tentukan environment default
ENV NODE_ENV=production
ENV PORT=3000

# Step 8: Expose port 3000 agar dapat diakses dari luar container
EXPOSE 3000

# Step 9: Gunakan user non-root 'node' (bawaan image alpine) demi keamanan
USER node

# Step 10: Jalankan aplikasi
CMD ["node", "src/server.js"]
