class MySqlMedicalCentersRepository {
  constructor (pool) {
    this.pool=pool;
  }

  async filter(queryFilters, query) {
    let conditions = [];
    let values = [];
    let page = 1;

    if (queryFilters.name) {
      conditions.push('LOWER(name) LIKE ?');
      values.push(`%${queryFilters.name.toLowerCase()}%`);
    }

    if (queryFilters.city) {
      conditions.push('LOWER(city) LIKE ?');
      values.push(`%${queryFilters.city.toLowerCase()}%`);
    }

    if (queryFilters.lat !== undefined) {
      conditions.push('lat BETWEEN ? AND ?');
      values.push(queryFilters.lat - 0.2, queryFilters.lat + 0.2);
    }

    if (queryFilters.lng !== undefined) {
      conditions.push('lng BETWEEN ? AND ?');
      values.push(queryFilters.lng - 0.2, queryFilters.lng + 0.2);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (queryFilters.page) {
      page = Number(queryFilters.page);
    }
    
    return { query, conditions, values, page };
  }


  async findById(medicalCenterId) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            id,
            name,
            city,
            lat,
            lng
          FROM medical_centers
          WHERE id = ?
          LIMIT 1
        `,
        [medicalCenterId]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findAll(limit, queryFilters) {
    try {
      const baseQuery = `
        SELECT
          id,
          name,
          city,
          lat,
          lng
        FROM medical_centers
      `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const hasCoords = queryFilters.lat !== undefined && queryFilters.lng !== undefined;
      const sortBy = queryFilters.sort_by ?? (hasCoords ? 'distance' : 'name');

      function haversineKm(lat1, lon1, lat2, lon2) {
        const toRad = (v) => (Number(v) * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      // Special sort: first availability
      if (sortBy === 'first_availability' && queryFilters.speciality_id) {
        // fetch centers matching the filters (no pagination yet)
        const filterValues = [...values];
        const [centers] = await this.pool.query(query, filterValues);

        if (centers.length === 0) {
          return { success: true, data: [] };
        }

        // fetch appointments for the speciality within a date window.
        // If since/until are not provided, use a sensible default window (next 7 days).
        const slotMinutes = queryFilters.slot_minutes ? Number(queryFilters.slot_minutes) : 30;
        const defaultWindowDays = queryFilters.window_days ? Number(queryFilters.window_days) : 7;

        const now = new Date();
        const sinceDate = queryFilters.since ? new Date(queryFilters.since.replace(' ', 'T')) : now;
        const untilDate = queryFilters.until
          ? new Date(queryFilters.until.replace(' ', 'T'))
          : new Date(sinceDate.getTime() + defaultWindowDays * 24 * 60 * 60 * 1000);

        function formatDateForSql(d) {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }

        const sinceStr = queryFilters.since ? queryFilters.since : formatDateForSql(sinceDate);
        const untilStr = queryFilters.until ? queryFilters.until : formatDateForSql(untilDate);
        const specialityId = queryFilters.speciality_id;

        const [appointmentsRows] = await this.pool.query(
          `
            SELECT center_id, starts_at, ends_at
            FROM appointments
            WHERE starts_at between ? AND ?
              AND speciality_id = ?
              AND status NOT IN ('EXPIRED', 'CANCELLED', 'ABSENT')
            ORDER BY starts_at ASC
          `,
          [sinceStr, untilStr, specialityId]
        );

        const apptsByCenter = {};
        for (const r of appointmentsRows) {
          const cid = r.center_id;
          if (!apptsByCenter[cid]) apptsByCenter[cid] = [];
          apptsByCenter[cid].push({ starts_at: new Date(r.starts_at), ends_at: new Date(r.ends_at) });
        }

        const slotMs = slotMinutes * 60 * 1000;

        function computeEarliest(appts) {
          const OPEN_HOUR = 9;
          const CLOSE_HOUR = 18;

          appts = (appts || []).slice().sort((a, b) => a.starts_at - b.starts_at);

          let candidate = new Date(sinceDate.getTime());

          // Alinear al múltiplo de 30 minutos más cercano
          candidate.setSeconds(0, 0);

          const minutes = candidate.getMinutes();
          if (minutes % slotMinutes !== 0) {
            candidate.setMinutes(
            Math.ceil(minutes / slotMinutes) * slotMinutes,
            0,
            0
            );
          }

          while (candidate < untilDate) {
            const hour = candidate.getHours();
            const minute = candidate.getMinutes();

            // Antes de las 09:00 → 09:00
            if (hour < OPEN_HOUR) {
              candidate.setHours(OPEN_HOUR, 0, 0, 0);
              continue;
            }

            // Después del último slot válido (17:30)
            if (
              hour > CLOSE_HOUR - 1 ||
              (hour === CLOSE_HOUR - 1 && minute > 30)
            ) {
              candidate.setDate(candidate.getDate() + 1);
              candidate.setHours(OPEN_HOUR, 0, 0, 0);
              continue;
              }

            const candidateEnd = new Date(candidate.getTime() + slotMs);

            let overlapped = false;

            for (const a of appts) {
              if (
                a.starts_at < candidateEnd &&
                a.ends_at > candidate
              ) {
                overlapped = true;
                break;
                }
            }

            if (!overlapped) {
              return candidate;
            }

            candidate = new Date(candidate.getTime() + slotMs);
          }

        return null;
      }

        function formatDate(d) {
          if (!d) return null;
          const pad = (n) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }

        const centersWithAvailability = centers.map((c) => {
          const earliest = computeEarliest(apptsByCenter[c.id]);
          const distance_km = hasCoords ? Number(haversineKm(queryFilters.lat, queryFilters.lng, c.lat, c.lng).toFixed(3)) : null;
          return Object.assign({}, c, { earliest_available: earliest ? formatDate(earliest) : null, distance_km });
        });

        // sort by earliest availability (null last), then by distance if coords provided
        centersWithAvailability.sort((a, b) => {
          if (!a.earliest_available && !b.earliest_available) return 0;
          if (!a.earliest_available) return 1;
          if (!b.earliest_available) return -1;

          const da = new Date(a.earliest_available.replace(' ', 'T'));
          const db = new Date(b.earliest_available.replace(' ', 'T'));
          if (da < db) return -1;
          if (da > db) return 1;

          if (hasCoords) {
            const distA = haversineKm(queryFilters.lat, queryFilters.lng, a.lat, a.lng);
            const distB = haversineKm(queryFilters.lat, queryFilters.lng, b.lat, b.lng);
            if (distA < distB) return -1;
            if (distA > distB) return 1;
          }

          return a.name.localeCompare(b.name) || a.id - b.id;
        });

        const offset = (page - 1) * limit;
        const paginated = centersWithAvailability.slice(offset, offset + limit);

        return { success: true, data: paginated };
      }

      let orderBy = ' ORDER BY name ASC, id ASC';
      if (sortBy === 'distance' && hasCoords) {
        orderBy = `
          ORDER BY (6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(lat)) * COS(RADIANS(lng) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(lat))
          )) ASC, name ASC, id ASC
        `;
        values.push(queryFilters.lat, queryFilters.lng, queryFilters.lat);
      }

      const offset = (page - 1) * limit;
      const finalQuery = query + orderBy + ' LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.query(finalQuery, values);

      const rowsWithDistance = rows.map((r) => {
        const distance_km = hasCoords ? Number(haversineKm(queryFilters.lat, queryFilters.lng, r.lat, r.lng).toFixed(3)) : null;
        return Object.assign({}, r, { distance_km });
      });

      return { success: true, data: rowsWithDistance };

    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message
      };
    }
  }

  async count(queryFilters) {
    try {
      const baseQuery = `
        SELECT COUNT(1) AS count
        FROM medical_centers
      `;
      
      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const [rows] = await this.pool.query(query, values);
      return { success: true, data: rows[0].count };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message
      };
    }
  }
}

module.exports = {MySqlMedicalCentersRepository};