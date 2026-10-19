import { useRef, useState } from 'react'
import { sb, r2, tot, inr } from './db.js'
import { Call, Alert, Icon, pick, uid, today, phoneOk, cleanPhone } from './common.jsx'

const SV = ['FTL', 'PTL', 'Industrial Goods Transport']
const ST = ['Booked', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled']

export default function ShipForm({ d, go, load, sel }) {
  const e = d.shipments.find(x => x.id === sel)
  const co = d.companies.find(c => c.id === e?.company_id)
  const dr = d.drivers.find(c => c.id === e?.driver_id)

  const base = useRef(e?.updated_at)
  const newId = useRef(uid())
  const lock = useRef(false)

  const [f, setF] = useState(
    e
      ? {
          ...e,
          company: co?.name || '',
          driver: dr?.name || '',
          driver_phone: dr?.phone || '',
          contact_name: e.contact_name || '',
          contact_phone: e.contact_phone || ''
        }
      : {
          dispatch_date: today(),
          service: 'FTL',
          status: 'Booked',
          unit: 'Tons',
          extra_charges: 0,
          deductions: 0
        }
  )

  const [busy, setBusy] = useState(false)
  const [m, setM] = useState('')

  const I = (k, l, p = {}) => (
    <div className="fld">
      <label htmlFor={'f-' + k}>{l}</label>
      <input
        id={'f-' + k}
        className="in"
        value={f[k] ?? ''}
        onChange={x => setF({ ...f, [k]: x.target.value })}
        {...p}
      />
    </div>
  )

  const save = async () => {
    if (lock.current) return
    setM('')

    for (const k of ['truck_no', 'company', 'driver', 'origin', 'destination']) {
      if (!(f[k] || '').trim()) {
        return setM('Please fill all fields marked *.')
      }
    }

    if (!f.dispatch_date) {
      return setM('Please choose the dispatch date.')
    }

    // Validate delivery date against dispatch date.
    // HTML date inputs should provide YYYY-MM-DD values.
    if (f.expected_date) {
      const validDate = /^\d{4}-\d{2}-\d{2}$/

      if (!validDate.test(f.dispatch_date) || !validDate.test(f.expected_date)) {
        return setM('Please check the dispatch and expected delivery dates.')
      }

      if (f.expected_date < f.dispatch_date) {
        return setM(
          `Expected delivery (${f.expected_date}) cannot be before dispatch (${f.dispatch_date}). Please check the year.`
        )
      }
    }

    for (const k of ['customer_freight', 'driver_freight', 'commission']) {
      if (f[k] === undefined || f[k] === '' || !(+f[k] >= 0)) {
        return setM('Please enter all three amounts (0 or more).')
      }
    }

    if (+f.extra_charges < 0 || +f.deductions < 0) {
      return setM('Extra charges and deductions cannot be below zero.')
    }

    if (+f.deductions > +f.customer_freight + +f.extra_charges) {
      return setM('Deductions are more than the company freight.')
    }

    if (+f.commission > +f.customer_freight) {
      return setM('Commission is more than the company freight. Please check.')
    }

    if (!phoneOk(f.contact_phone) || !phoneOk(f.driver_phone)) {
      return setM('Please check the phone number. It should have 10 to 13 digits.')
    }

    if (e) {
      const rec = tot(d.payments, e.id, 'receipt')
      const pd = tot(d.payments, e.id, 'driver')
      const cr = tot(d.payments, e.id, 'commission')

      if (r2(+f.customer_freight + +f.extra_charges - +f.deductions) < rec) {
        return setM(
          'Company amount is lower than the Rs ' +
          rec +
          ' already received. Cancel the wrong payment first.'
        )
      }

      if (+f.driver_freight < pd) {
        return setM(
          'Driver freight is lower than the Rs ' +
          pd +
          ' already paid. Cancel the wrong payment first.'
        )
      }

      if (+f.commission < cr) {
        return setM(
          'Commission is lower than the Rs ' +
          cr +
          ' already received.'
        )
      }

      if (
        rec > 0 &&
        co &&
        co.name.toLowerCase() !== f.company.trim().toLowerCase()
      ) {
        return setM(
          'Payments are already saved for ' +
          co.name +
          '. The company cannot be changed.'
        )
      }

      if (
        pd > 0 &&
        dr &&
        dr.name.toLowerCase() !== f.driver.trim().toLowerCase()
      ) {
        return setM(
          'Payments are already saved for ' +
          dr.name +
          '. The driver cannot be changed.'
        )
      }

      if (
        f.status === 'Cancelled' &&
        e.status !== 'Cancelled' &&
        (rec > 0 || pd > 0) &&
        !confirm('This shipment has saved payments. Cancel it anyway?')
      ) {
        return
      }
    }

    lock.current = true
    setBusy(true)

    try {
      let c = d.companies.find(
        x => x.name.toLowerCase() === f.company.trim().toLowerCase()
      )

      const ct = {
        role: 'Contact',
        name: f.contact_name || '',
        phone: cleanPhone(f.contact_phone)
      }

      if (!c) {
        const r = await sb
          .from('companies')
          .insert({
            name: f.company.trim().replace(/\s+/g, ' '),
            contacts: ct.phone ? [ct] : []
          })
          .select()
          .single()

        if (r.error) throw r.error
        c = r.data
      } else if (
        ct.phone &&
        !(c.contacts || []).some(x => cleanPhone(x.phone) === ct.phone)
      ) {
        const r = await sb
          .from('companies')
          .update({ contacts: [...(c.contacts || []), ct] })
          .eq('id', c.id)

        if (r.error) throw r.error
      }

      let v = d.drivers.find(
        x =>
          x.name.toLowerCase() === f.driver.trim().toLowerCase() &&
          (!f.driver_phone ||
            !x.phone ||
            cleanPhone(x.phone) === cleanPhone(f.driver_phone))
      )

      if (!v) {
        const r = await sb
          .from('drivers')
          .insert({
            name: f.driver.trim().replace(/\s+/g, ' '),
            phone: cleanPhone(f.driver_phone) || null,
            truck_no: f.truck_no.trim().toUpperCase()
          })
          .select()
          .single()

        if (r.error) throw r.error
        v = r.data
      } else if (f.driver_phone && !v.phone) {
        const r = await sb
          .from('drivers')
          .update({ phone: cleanPhone(f.driver_phone) })
          .eq('id', v.id)

        if (r.error) throw r.error
      }

      const row = {
        dispatch_date: f.dispatch_date,
        service: f.service,
        truck_no: f.truck_no.trim().toUpperCase().replace(/\s+/g, ''),
        truck_type: f.truck_type || null,
        driver_id: v.id,
        company_id: c.id,
        contact_name: f.contact_name || null,
        contact_phone: cleanPhone(f.contact_phone) || null,
        origin: f.origin.trim(),
        destination: f.destination.trim(),
        goods: f.goods || null,
        weight: f.weight === '' || f.weight == null ? null : +f.weight,
        unit: f.unit || null,
        expected_date: f.expected_date || null,
        status: f.status,
        customer_freight: r2(f.customer_freight),
        driver_freight: r2(f.driver_freight),
        commission: r2(f.commission),
        extra_charges: r2(f.extra_charges),
        deductions: r2(f.deductions),
        notes: f.notes || null
      }

      let r

      if (e) {
        r = await sb
          .from('shipments')
          .update(row)
          .eq('id', e.id)
          .eq('updated_at', base.current)
          .select()
          .maybeSingle()

        if (!r.error && !r.data) {
          await load()
          throw new Error(
            'This shipment was changed by someone else. The latest version is now loaded. Please open Edit again.'
          )
        }
      } else {
        r = await sb
          .from('shipments')
          .insert({ id: newId.current, ...row })
          .select()
          .single()

        if (r.error?.code === '23505') {
          await load()
          return go('ships')
        }
      }

      if (r.error) throw r.error

      await load()
      go('ship', r.data.id)
    } catch (x) {
      setM(
        'Something Went Wrong: ' +
        (x.message || '').replace(/^BTS: /, '')
      )
    }

    lock.current = false
    setBusy(false)
  }

  const coMatch = d.companies.find(
    c => c.name.toLowerCase() === (f.company || '').trim().toLowerCase()
  )
  const dueNow =
    f.customer_freight === undefined || f.customer_freight === ''
      ? null
      : r2(+f.customer_freight + (+f.extra_charges || 0) - (+f.deductions || 0))

  return (
    <>
      <div className="bar">
        <p className="sub-t">
          {e ? 'Editing shipment ' + e.code : 'Fields marked * are required.'}
        </p>
      </div>

      <div className="fcols">
        <section className="card fcard">
          <h2>Shipment</h2>
          <div className="fgrid k2">
            {I('dispatch_date', 'Dispatch Date *', { type: 'date' })}
            <div className="fld">
              <label htmlFor="f-service">Shipment Type</label>
              <select
                id="f-service"
                className="in"
                value={f.service}
                onChange={x => setF({ ...f, service: x.target.value })}
              >
                {SV.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div className="fgrid k2">
            {I('truck_no', 'Truck Number *', {
              placeholder: 'PB10AB1234',
              autoCapitalize: 'characters'
            })}
            {I('truck_type', 'Truck Type (optional)')}
          </div>
          <div className="fld">
            <label htmlFor="f-status">Status</label>
            <select
              id="f-status"
              className="in"
              value={f.status}
              onChange={x => setF({ ...f, status: x.target.value })}
            >
              {ST.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
        </section>

        <section className="card fcard">
          <h2>Company</h2>

          <datalist id="cl">
            {d.companies.map(c => <option key={c.id} value={c.name} />)}
          </datalist>

          {I('company', 'Company Name *', { list: 'cl' })}

          {(coMatch?.contacts || []).length > 0 && (
            <div className="chips">
              {coMatch.contacts.map((x, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn o s"
                  onClick={() =>
                    setF({
                      ...f,
                      contact_name: x.name,
                      contact_phone: x.phone
                    })
                  }
                >
                  {x.role}: {x.name || x.phone}
                </button>
              ))}
            </div>
          )}

          <div className="fgrid k2">
            {I('contact_name', 'Contact Person')}
            {I('contact_phone', 'Contact Phone', {
              type: 'tel',
              inputMode: 'tel'
            })}
          </div>

          <div className="acts" style={{ marginTop: 0, marginBottom: 12 }}>
            <button
              type="button"
              className="btn o s"
              onClick={() =>
                pick((n, p) =>
                  setF(z => ({
                    ...z,
                    contact_name: n,
                    contact_phone: p
                  }))
                )
              }
            >
              <Icon n="contact" />
              Select Contact
            </button>
            <Call n={f.contact_phone} />
          </div>
        </section>

        <section className="card fcard">
          <h2>Driver</h2>

          <datalist id="dl">
            {d.drivers.map(c => <option key={c.id} value={c.name} />)}
          </datalist>

          <div className="fgrid k2">
            {I('driver', 'Driver Name *', { list: 'dl' })}
            {I('driver_phone', 'Driver Phone', {
              type: 'tel',
              inputMode: 'tel'
            })}
          </div>

          <div className="acts" style={{ marginTop: 0, marginBottom: 12 }}>
            <button
              type="button"
              className="btn o s"
              onClick={() =>
                pick((n, p) =>
                  setF(z => ({
                    ...z,
                    driver: n,
                    driver_phone: p
                  }))
                )
              }
            >
              <Icon n="contact" />
              Select Contact
            </button>
            <Call n={f.driver_phone} t="Call Driver" />
          </div>
        </section>

        <section className="card fcard">
          <h2>Route and cargo</h2>
          <div className="fgrid k2">
            {I('origin', 'From *')}
            {I('destination', 'To *')}
          </div>

          {I('goods', 'Goods')}

          <div className="fgrid k2">
            {I('weight', 'Weight / Quantity', {
              type: 'number',
              inputMode: 'decimal'
            })}
            {I('unit', 'Unit')}
          </div>

          {I('expected_date', 'Expected Delivery (optional)', { type: 'date' })}
        </section>

        <section className="card fcard fwide">
          <h2>Amounts (₹)</h2>

          <div className="fgrid k3">
            {I('customer_freight', 'Company Freight *', {
              type: 'number',
              inputMode: 'decimal'
            })}

            {I('driver_freight', 'Driver Freight *', {
              type: 'number',
              inputMode: 'decimal'
            })}

            {I('commission', 'BTS Commission *', {
              type: 'number',
              inputMode: 'decimal'
            })}
          </div>

          <div className="fgrid k2">
            {I('extra_charges', 'Extra Charges (added to company amount)', {
              type: 'number',
              inputMode: 'decimal'
            })}
            {I('deductions', 'Deductions (taken off company amount)', {
              type: 'number',
              inputMode: 'decimal'
            })}
          </div>

          {dueNow !== null && (
            <div className="derived">
              <span>Amount due from company</span>
              <b>{inr(dueNow)}</b>
            </div>
          )}

          {I('notes', 'Notes')}
        </section>
      </div>

      {m && <Alert>{m}</Alert>}

      <div className="acts formbar">
        <button
          className="btn g"
          style={{ flex: '1 1 220px' }}
          disabled={busy}
          onClick={save}
        >
          {busy ? 'Saving…' : 'Save Shipment'}
        </button>

        {e && (
          <button
            className="btn o"
            style={{ flex: '1 1 160px' }}
            onClick={() => go('ship', e.id)}
          >
            Close Without Saving
          </button>
        )}
      </div>
    </>
  )
}